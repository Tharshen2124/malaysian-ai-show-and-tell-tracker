import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { presentStatusValidator } from "./schema";
import { requireAdmin, requireMember } from "./lib/auth";

export const DEFAULT_PRESENTATION_MINUTES = 3;
export const DEFAULT_FEEDBACK_MINUTES = 2;

const MAX_NAME_LENGTH = 60;
/** A leaked code should not be able to fill the table; a room this size never will. */
const MAX_SIGNUPS = 100;
const CODE_LENGTH = 6;
/** 0/O/1/I/L are omitted — this code gets read off a projector and typed by hand. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Codes are stored uppercase, so every lookup has to arrive in the same shape. */
function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function sessionByCodeDoc(ctx: QueryCtx, code: string) {
  return await ctx.db
    .query("presentSessions")
    .withIndex("by_code", (q) => q.eq("code", normalizeCode(code)))
    .unique();
}

/**
 * The session currently in play. `createSession` closes any predecessor, so at
 * most one is ever open — but the two open statuses live in separate index
 * ranges, so both are checked and the newer wins.
 */
async function openSession(ctx: QueryCtx): Promise<Doc<"presentSessions"> | null> {
  const [collecting, locked] = await Promise.all([
    ctx.db
      .query("presentSessions")
      .withIndex("by_status", (q) => q.eq("status", "collecting"))
      .order("desc")
      .first(),
    ctx.db
      .query("presentSessions")
      .withIndex("by_status", (q) => q.eq("status", "locked"))
      .order("desc")
      .first(),
  ]);
  if (!collecting) return locked;
  if (!locked) return collecting;
  return collecting._creationTime > locked._creationTime ? collecting : locked;
}

async function signupsInOrder(ctx: QueryCtx, sessionId: Id<"presentSessions">) {
  const rows = await ctx.db
    .query("presentSignups")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();
  // Ties fall back to arrival time, so two rows sharing a position can never
  // flip between renders.
  rows.sort((a, b) => a.position - b.position || a._creationTime - b._creationTime);
  return rows;
}

function publicSignup(row: Doc<"presentSignups">) {
  return { _id: row._id, name: row.name, position: row.position };
}

function assertMinutes(label: string, value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > 120) {
    throw new Error(`${label} must be between 0 and 120 minutes`);
  }
}

// ---------------------------------------------------------------------------
// Admin / member surface
// ---------------------------------------------------------------------------

export const activeSession = query({
  args: {},
  handler: async (ctx) => {
    await requireMember(ctx);
    const session = await openSession(ctx);
    if (!session) return null;
    return { ...session, signups: (await signupsInOrder(ctx, session._id)).map(publicSignup) };
  },
});

export const createSession = mutation({
  args: {
    presentationMinutes: v.optional(v.number()),
    feedbackMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const presentationMinutes = args.presentationMinutes ?? DEFAULT_PRESENTATION_MINUTES;
    const feedbackMinutes = args.feedbackMinutes ?? DEFAULT_FEEDBACK_MINUTES;
    assertMinutes("Presentation time", presentationMinutes);
    assertMinutes("Feedback time", feedbackMinutes);

    // Only one session may be open, so starting a new one closes the old.
    const previous = await openSession(ctx);
    if (previous) await ctx.db.patch(previous._id, { status: "done", updatedAt: Date.now() });

    // Retry rather than trust one draw: a collision would hand two rooms the
    // same code, and `sessionByCodeDoc` would then throw on `.unique()`.
    let code = randomCode();
    for (let attempt = 0; attempt < 10 && (await sessionByCodeDoc(ctx, code)); attempt++) {
      code = randomCode();
    }
    if (await sessionByCodeDoc(ctx, code)) throw new Error("Could not allocate a join code");

    return await ctx.db.insert("presentSessions", {
      code,
      status: "collecting",
      presentationMinutes,
      feedbackMinutes,
      updatedAt: Date.now(),
    });
  },
});

async function requireSession(ctx: MutationCtx, id: Id<"presentSessions">) {
  const session = await ctx.db.get(id);
  if (!session) throw new Error("Session not found");
  return session;
}

export const reorder = mutation({
  args: {
    sessionId: v.id("presentSessions"),
    orderedIds: v.array(v.id("presentSignups")),
  },
  handler: async (ctx, { sessionId, orderedIds }) => {
    await requireAdmin(ctx);
    const session = await requireSession(ctx, sessionId);

    const existing = await signupsInOrder(ctx, sessionId);
    // A stale list from a tab that missed a late arrival would silently drop or
    // duplicate someone, so the ids must match the session exactly.
    const seen = new Set(orderedIds);
    if (seen.size !== orderedIds.length || seen.size !== existing.length) {
      throw new Error("Order is out of date — refresh and try again");
    }
    for (const row of existing) {
      if (!seen.has(row._id)) throw new Error("Order is out of date — refresh and try again");
    }

    // Mid-session, only the queue behind the current talk may move. Shuffling
    // someone who has presented back into it would give them a second turn, and
    // moving the person on stage would swap names under a running clock.
    if (session.status === "locked") {
      const frozen = Math.min((session.currentIndex ?? 0) + 1, existing.length);
      for (let i = 0; i < frozen; i++) {
        if (orderedIds[i] !== existing[i]._id) {
          throw new Error("Only people still waiting can be moved");
        }
      }
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { position: i, updatedAt: Date.now() });
    }
    return null;
  },
});

export const removeSignup = mutation({
  args: { id: v.id("presentSignups") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Signup not found");
    const removedIndex = (await signupsInOrder(ctx, row.sessionId)).findIndex((s) => s._id === id);
    await ctx.db.delete(id);

    // Re-pack, so positions stay contiguous and the next `reorder` lines up.
    const remaining = await signupsInOrder(ctx, row.sessionId);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await ctx.db.patch(remaining[i]._id, { position: i, updatedAt: Date.now() });
      }
    }

    // The turn pointer is an index, so removing someone above it would hand the
    // stage to the next person mid-talk. Pull it up with the rows instead.
    // Removing the presenter themselves leaves it where it is on purpose: the
    // next person steps up, or — if they were last — it sits one past the end,
    // which reads as everyone done until a latecomer scans in.
    const session = await ctx.db.get(row.sessionId);
    if (
      session?.status === "locked" &&
      session.currentIndex !== undefined &&
      removedIndex < session.currentIndex
    ) {
      await ctx.db.patch(session._id, {
        currentIndex: session.currentIndex - 1,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const setStatus = mutation({
  args: { sessionId: v.id("presentSessions"), status: presentStatusValidator },
  handler: async (ctx, { sessionId, status }) => {
    await requireAdmin(ctx);
    await requireSession(ctx, sessionId);
    // Locking starts the running order at the top; reopening drops the pointer
    // so a stale turn cannot be shown against a roster being rearranged.
    await ctx.db.patch(sessionId, {
      status,
      currentIndex: status === "locked" ? 0 : undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setCurrentIndex = mutation({
  args: { sessionId: v.id("presentSessions"), index: v.number() },
  handler: async (ctx, { sessionId, index }) => {
    await requireAdmin(ctx);
    const session = await requireSession(ctx, sessionId);
    const signups = await signupsInOrder(ctx, sessionId);
    if (!Number.isInteger(index) || index < 0 || index >= Math.max(signups.length, 1)) {
      throw new Error("No such presenter");
    }
    if (session.status !== "locked") throw new Error("The order is not locked yet");
    await ctx.db.patch(sessionId, { currentIndex: index, updatedAt: Date.now() });
    return null;
  },
});

export const updateDurations = mutation({
  args: {
    sessionId: v.id("presentSessions"),
    presentationMinutes: v.number(),
    feedbackMinutes: v.number(),
  },
  handler: async (ctx, { sessionId, presentationMinutes, feedbackMinutes }) => {
    await requireAdmin(ctx);
    await requireSession(ctx, sessionId);
    assertMinutes("Presentation time", presentationMinutes);
    assertMinutes("Feedback time", feedbackMinutes);
    await ctx.db.patch(sessionId, {
      presentationMinutes,
      feedbackMinutes,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Public surface — the phone that scanned the QR. No sign-in; the code is the
// permission, and it only ever grants a write to its own session.
// ---------------------------------------------------------------------------

export const sessionByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const session = await sessionByCodeDoc(ctx, code);
    if (!session) return null;
    // Deliberately narrow: an anonymous caller learns whether sign-ups are open
    // and how many people are in, never the roster or the session id.
    const signups = await signupsInOrder(ctx, session._id);
    return { status: session.status, signupCount: signups.length };
  },
});

export const join = mutation({
  args: { code: v.string(), name: v.string() },
  handler: async (ctx, { code, name }) => {
    const session = await sessionByCodeDoc(ctx, code);
    if (!session) throw new Error("Unknown session");
    // Stragglers keep turning up after the talks start, so the door only shuts
    // once the session is finished.
    if (session.status === "done") throw new Error("Sign-ups are closed");

    const trimmed = name.trim();
    if (trimmed === "") throw new Error("Name is required");
    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
    }

    const existing = await signupsInOrder(ctx, session._id);
    if (existing.length >= MAX_SIGNUPS) throw new Error("This session is full");
    if (existing.some((row) => row.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error("That name is already on the list");
    }

    // Late arrivals go to the bottom rather than into the middle of an order the
    // admin may already have set — or ahead of someone who has already presented.
    const position = existing.reduce((max, row) => Math.max(max, row.position + 1), 0);
    // Handed back so the phone can watch its own place in the queue. It is the
    // holder's own row, so it discloses nothing the sender did not just write.
    return await ctx.db.insert("presentSignups", {
      sessionId: session._id,
      name: trimmed,
      position,
      updatedAt: Date.now(),
    });
  },
});

/** Where one attendee stands, from their phone's point of view. */
export type PlaceState = "waiting" | "next" | "presenting" | "done";

export const myPlace = query({
  args: { code: v.string(), signupId: v.string() },
  handler: async (ctx, { code, signupId }) => {
    const session = await sessionByCodeDoc(ctx, code);
    if (!session) return null;

    // The id comes out of the phone's localStorage, so it may be stale, from a
    // previous session, or garbage. normalizeId rejects a malformed one instead
    // of throwing at the argument validator.
    const id = ctx.db.normalizeId("presentSignups", signupId);
    if (!id) return null;
    const mine = await ctx.db.get(id);
    if (!mine || mine.sessionId !== session._id) return null;

    const signups = await signupsInOrder(ctx, session._id);
    const index = signups.findIndex((row) => row._id === id);
    if (index === -1) return null;

    const current = session.status === "locked" ? (session.currentIndex ?? 0) : null;
    let state: PlaceState = "waiting";
    if (session.status === "done") {
      // The session is over. Nobody is still queueing, whether or not their
      // turn ever came around.
      state = "done";
    } else if (current !== null) {
      if (index < current) state = "done";
      else if (index === current) state = "presenting";
      else if (index === current + 1) state = "next";
    }

    // One past the end is legitimate — the last presenter was removed — and
    // means nobody is on stage rather than that the first person is.
    const currentNumber = current !== null && current < signups.length ? current + 1 : null;

    // The running order, as it reads on the screen at the front of the room.
    // These names are already on the projector in front of everyone, and a phone
    // that cannot see the list has no way to judge how close its turn is. Holding
    // the code is still what gates the read, and nothing here identifies anyone
    // beyond the name they typed in themselves.
    const roster = signups.map((row, i) => ({
      name: row.name,
      number: i + 1,
      isYou: row._id === id,
    }));

    return {
      name: mine.name,
      position: index + 1,
      total: signups.length,
      state,
      status: session.status,
      currentNumber,
      roster,
    };
  },
});
