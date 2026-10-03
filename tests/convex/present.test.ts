import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import { modules } from "./test.setup";
import { seedAccess } from "./seed";

/** Starts a session as the admin and hands back its id and join code. */
async function startSession(t: ReturnType<typeof convexTest>) {
  const { admin, member } = await seedAccess(t);
  const sessionId = await admin.mutation(api.present.createSession, {});
  const code = await t.run(async (ctx) => (await ctx.db.get(sessionId))!.code);
  return { admin, member, sessionId, code };
}

/** A client acting as one signed-in person. */
type Identity = ReturnType<ReturnType<typeof convexTest>["withIdentity"]>;

/** Four people, talks under way, Janelle (index 1) on stage. */
async function midSession(t: ReturnType<typeof convexTest>) {
  const started = await startSession(t);
  const { admin, sessionId, code } = started;
  const ids = [];
  for (const name of ["Aiden", "Janelle", "Hesham", "Latecomer"]) {
    ids.push(await t.mutation(api.present.join, { code, name }));
  }
  await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
  await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });
  return { ...started, ids };
}

/** The session as a second admin device reads it. */
const sessionState = async (admin: Identity) =>
  (await admin.query(api.present.activeSession, {}))!;

async function namesInOrder(admin: Identity) {
  const session = await admin.query(api.present.activeSession, {});
  return session!.signups.map((s) => s.name);
}

describe("present.join — the anonymous scan path", () => {
  it("accepts a name from a caller who is not signed in", async () => {
    const t = convexTest(schema, modules);
    const { admin, code } = await startSession(t);

    // No identity at all: this is the phone that scanned the QR.
    await t.mutation(api.present.join, { code, name: "Aiden" });

    expect(await namesInOrder(admin)).toEqual(["Aiden"]);
  });

  it("accepts the code in any case, since it is typed off a screen", async () => {
    const t = convexTest(schema, modules);
    const { admin, code } = await startSession(t);

    await t.mutation(api.present.join, { code: code.toLowerCase(), name: "Janelle" });

    expect(await namesInOrder(admin)).toEqual(["Janelle"]);
  });

  it("rejects an unknown code", async () => {
    const t = convexTest(schema, modules);
    await startSession(t);
    await expect(
      t.mutation(api.present.join, { code: "ZZZZZZ", name: "Nobody" }),
    ).rejects.toThrow("Unknown session");
  });

  it("still takes a latecomer once talks are under way, at the back of the queue", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    for (const name of ["Aiden", "Janelle"]) {
      await t.mutation(api.present.join, { code, name });
    }
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });

    const latecomer = await t.mutation(api.present.join, { code, name: "Latecomer" });

    expect(await namesInOrder(admin)).toEqual(["Aiden", "Janelle", "Latecomer"]);
    expect(
      (await t.query(api.present.myPlace, { code, signupId: latecomer }))!.state,
    ).toBe("next");
  });

  it("rejects a name once the session is finished", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    await admin.mutation(api.present.setStatus, { sessionId, status: "done" });

    await expect(
      t.mutation(api.present.join, { code, name: "Latecomer" }),
    ).rejects.toThrow("Sign-ups are closed");
  });

  it("rejects a duplicate name regardless of case", async () => {
    const t = convexTest(schema, modules);
    const { code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Hesham" });

    await expect(
      t.mutation(api.present.join, { code, name: "  hesham " }),
    ).rejects.toThrow("That name is already on the list");
  });

  it("rejects a blank name and an over-long one", async () => {
    const t = convexTest(schema, modules);
    const { code } = await startSession(t);

    await expect(t.mutation(api.present.join, { code, name: "   " })).rejects.toThrow(
      "Name is required",
    );
    await expect(
      t.mutation(api.present.join, { code, name: "a".repeat(61) }),
    ).rejects.toThrow("60 characters or fewer");
  });

  it("appends a latecomer to the bottom, leaving the admin's order alone", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    for (const name of ["Aiden", "Janelle", "Hesham"]) {
      await t.mutation(api.present.join, { code, name });
    }

    // Admin reverses the order, then a fourth person scans in.
    const before = (await admin.query(api.present.activeSession, {}))!.signups;
    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [...before].reverse().map((s) => s._id),
    });
    await t.mutation(api.present.join, { code, name: "Latecomer" });

    expect(await namesInOrder(admin)).toEqual(["Hesham", "Janelle", "Aiden", "Latecomer"]);
  });
});

describe("present.sessionByCode", () => {
  it("tells an anonymous caller only whether it is open, and how many are in", async () => {
    const t = convexTest(schema, modules);
    const { code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });

    const result = await t.query(api.present.sessionByCode, { code });

    // The roster and the session id must never reach a phone.
    expect(result).toEqual({ status: "collecting", signupCount: 1 });
  });

  it("returns null for an unknown code rather than throwing", async () => {
    const t = convexTest(schema, modules);
    await startSession(t);
    expect(await t.query(api.present.sessionByCode, { code: "ZZZZZZ" })).toBeNull();
  });
});

describe("present admin surface authorization", () => {
  it("rejects a non-admin member on every write", async () => {
    const t = convexTest(schema, modules);
    const { member, sessionId, code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });
    const signupId = await t.run(async (ctx) => {
      const rows = await ctx.db.query("presentSignups").collect();
      return rows[0]._id;
    });

    await expect(member.mutation(api.present.createSession, {})).rejects.toThrow(
      "Admin access required",
    );
    await expect(
      member.mutation(api.present.reorder, { sessionId, orderedIds: [signupId] }),
    ).rejects.toThrow("Admin access required");
    await expect(
      member.mutation(api.present.removeSignup, { id: signupId }),
    ).rejects.toThrow("Admin access required");
    await expect(
      member.mutation(api.present.setStatus, { sessionId, status: "locked" }),
    ).rejects.toThrow("Admin access required");
  });

  it("rejects an anonymous caller reading the roster", async () => {
    const t = convexTest(schema, modules);
    await startSession(t);
    await expect(t.query(api.present.activeSession, {})).rejects.toThrow("Unauthorized");
  });
});

describe("present.reorder", () => {
  it("throws when the id list no longer matches the session", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });
    const stale = (await admin.query(api.present.activeSession, {}))!.signups;

    // Someone scans in between the admin loading the list and dropping a row.
    await t.mutation(api.present.join, { code, name: "Janelle" });

    await expect(
      admin.mutation(api.present.reorder, {
        sessionId,
        orderedIds: stale.map((s) => s._id),
      }),
    ).rejects.toThrow("Order is out of date");
  });

  /** Four people, talks started, Janelle (index 1) on stage. */
  async function midSession(t: ReturnType<typeof convexTest>) {
    const started = await startSession(t);
    const { admin, sessionId, code } = started;
    const ids = [];
    for (const name of ["Aiden", "Janelle", "Hesham", "Latecomer"]) {
      ids.push(await t.mutation(api.present.join, { code, name }));
    }
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });
    return { ...started, ids };
  }

  it("lets the queue behind the current talk be rearranged mid-session", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code, ids } = await midSession(t);
    const [aiden, janelle, hesham, latecomer] = ids;

    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [aiden, janelle, latecomer, hesham],
    });

    expect(await namesInOrder(admin)).toEqual(["Aiden", "Janelle", "Latecomer", "Hesham"]);
    expect((await t.query(api.present.myPlace, { code, signupId: janelle }))!.state).toBe(
      "presenting",
    );
    expect((await t.query(api.present.myPlace, { code, signupId: latecomer }))!.state).toBe(
      "next",
    );
  });

  it("never lets someone who has already presented be pulled back in", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [aiden, janelle, hesham, latecomer] = ids;

    // Aiden, already done, dragged back in behind Janelle — with the clock
    // stopped, and again with it running. Neither may give him a second turn.
    const pullAidenBack = () =>
      admin.mutation(api.present.reorder, {
        sessionId,
        orderedIds: [janelle, aiden, hesham, latecomer],
      });

    await expect(pullAidenBack()).rejects.toThrow("Only people who haven't presented can be moved");

    await admin.mutation(api.present.startClock, { sessionId });
    await expect(pullAidenBack()).rejects.toThrow("Only people still waiting can be moved");
  });

  it("lets the admin change who goes first while the clock is still stopped", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code, ids } = await midSession(t);
    const [aiden, janelle, hesham, latecomer] = ids;

    // Janelle is up but has not begun, so she and Hesham can still swap.
    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [aiden, hesham, janelle, latecomer],
    });

    expect(await namesInOrder(admin)).toEqual(["Aiden", "Hesham", "Janelle", "Latecomer"]);
    // The stage belongs to the index, so Hesham has inherited it — and both
    // phones are told, without the admin touching the turn pointer.
    const stateOf = async (id: string) =>
      (await t.query(api.present.myPlace, { code, signupId: id }))!.state;
    expect(await stateOf(hesham)).toBe("presenting");
    expect(await stateOf(janelle)).toBe("next");
  });

  it("pins the presenter the moment their clock is started", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [aiden, janelle, hesham, latecomer] = ids;

    await admin.mutation(api.present.startClock, { sessionId });

    // Janelle, now mid-talk, pushed down the queue.
    await expect(
      admin.mutation(api.present.reorder, {
        sessionId,
        orderedIds: [aiden, hesham, janelle, latecomer],
      }),
    ).rejects.toThrow("Only people still waiting can be moved");

    // The queue behind her is still free to move.
    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [aiden, janelle, latecomer, hesham],
    });
    expect(await namesInOrder(admin)).toEqual(["Aiden", "Janelle", "Latecomer", "Hesham"]);
  });
});

describe("present.startClock — pinning the person on stage", () => {
  const startedAt = async (admin: Identity) =>
    (await admin.query(api.present.activeSession, {}))!.currentStartedAt;

  it("records the slot once and leaves it alone when the clock stops and starts", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);

    await admin.mutation(api.present.startClock, { sessionId });
    const first = await startedAt(admin);
    expect(first).toBeTypeOf("number");

    // Pausing and resuming must not re-stamp a slot already under way.
    await admin.mutation(api.present.pauseClock, { sessionId });
    await admin.mutation(api.present.startClock, { sessionId });
    expect(await startedAt(admin)).toBe(first);

    // Nor does putting the clock back to zero for the same presenter.
    await admin.mutation(api.present.resetClock, { sessionId });
    expect(await startedAt(admin)).toBe(first);
  });

  it("is cleared when the turn moves on, so the next person is movable again", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [aiden, janelle, hesham, latecomer] = ids;
    await admin.mutation(api.present.startClock, { sessionId });

    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 2 });

    expect(await startedAt(admin)).toBeUndefined();
    // Hesham is up but has not begun, so Latecomer can still be sent ahead.
    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [aiden, janelle, latecomer, hesham],
    });
    expect(await namesInOrder(admin)).toEqual(["Aiden", "Janelle", "Latecomer", "Hesham"]);
  });

  it("is cleared when the presenter is removed and the next person steps up", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [, janelle] = ids;
    await admin.mutation(api.present.startClock, { sessionId });

    await admin.mutation(api.present.removeSignup, { id: janelle });

    // Hesham has been pushed onto the stage mid-way through someone else's
    // slot; his own has not started.
    expect(await startedAt(admin)).toBeUndefined();
  });

  it("survives a removal above the presenter, who is still mid-talk", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [aiden] = ids;
    await admin.mutation(api.present.startClock, { sessionId });

    await admin.mutation(api.present.removeSignup, { id: aiden });

    expect(await startedAt(admin)).toBeTypeOf("number");
  });

  it("is dropped when the order is reopened, and rejects a non-admin", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, sessionId } = await midSession(t);
    await admin.mutation(api.present.startClock, { sessionId });

    await expect(member.mutation(api.present.startClock, { sessionId })).rejects.toThrow(
      "Admin access required",
    );

    await admin.mutation(api.present.setStatus, { sessionId, status: "collecting" });
    expect(await startedAt(admin)).toBeUndefined();
  });
});

describe("present.removeSignup", () => {
  it("re-packs the remaining positions so the next reorder lines up", async () => {
    const t = convexTest(schema, modules);
    const { admin, code } = await startSession(t);
    for (const name of ["Aiden", "Janelle", "Hesham"]) {
      await t.mutation(api.present.join, { code, name });
    }
    const signups = (await admin.query(api.present.activeSession, {}))!.signups;

    await admin.mutation(api.present.removeSignup, { id: signups[0]._id });

    const after = (await admin.query(api.present.activeSession, {}))!.signups;
    expect(after.map((s) => s.name)).toEqual(["Janelle", "Hesham"]);
    expect(after.map((s) => s.position)).toEqual([0, 1]);
  });

  it("keeps the same person on stage when a name above them is removed", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const ids = [];
    for (const name of ["Aiden", "Janelle", "Hesham"]) {
      ids.push(await t.mutation(api.present.join, { code, name }));
    }
    const [aiden, janelle, hesham] = ids;
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });

    // Someone who already presented is taken off the list.
    await admin.mutation(api.present.removeSignup, { id: aiden });

    expect((await admin.query(api.present.activeSession, {}))!.currentIndex).toBe(0);
    expect((await t.query(api.present.myPlace, { code, signupId: janelle }))!.state).toBe(
      "presenting",
    );

    // Someone still waiting leaves the pointer where it is.
    await admin.mutation(api.present.removeSignup, { id: hesham });
    expect((await admin.query(api.present.activeSession, {}))!.currentIndex).toBe(0);
  });

  it("hands the stage to the next person when the presenter is removed", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const ids = [];
    for (const name of ["Aiden", "Janelle", "Hesham"]) {
      ids.push(await t.mutation(api.present.join, { code, name }));
    }
    const [, janelle, hesham] = ids;
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });

    await admin.mutation(api.present.removeSignup, { id: janelle });

    expect((await t.query(api.present.myPlace, { code, signupId: hesham }))!.state).toBe(
      "presenting",
    );
  });

  it("leaves nobody on stage when the last presenter is removed, until someone scans in", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const aiden = await t.mutation(api.present.join, { code, name: "Aiden" });
    const janelle = await t.mutation(api.present.join, { code, name: "Janelle" });
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });

    await admin.mutation(api.present.removeSignup, { id: janelle });

    // Aiden already had a turn and must not be buzzed back on stage.
    expect((await t.query(api.present.myPlace, { code, signupId: aiden }))!.state).toBe("done");

    const latecomer = await t.mutation(api.present.join, { code, name: "Latecomer" });
    expect((await t.query(api.present.myPlace, { code, signupId: latecomer }))!.state).toBe(
      "presenting",
    );
  });
});

describe("present.createSession", () => {
  it("closes the previous session so only one is ever open", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId: first } = await startSession(t);

    const second = await admin.mutation(api.present.createSession, {});

    expect(await admin.query(api.present.activeSession, {})).toMatchObject({
      _id: second,
    });
    expect(await t.run(async (ctx) => (await ctx.db.get(first))!.status)).toBe("done");
  });

  it("defaults to a 3 minute talk and 2 minutes of feedback", async () => {
    const t = convexTest(schema, modules);
    const { admin } = await startSession(t);
    const session = await admin.query(api.present.activeSession, {});
    expect(session).toMatchObject({ presentationMinutes: 3, feedbackMinutes: 2 });
  });

  it("refuses a duration outside the sane range", async () => {
    const t = convexTest(schema, modules);
    const { admin } = await startSession(t);
    await expect(
      admin.mutation(api.present.createSession, { presentationMinutes: 0 }),
    ).rejects.toThrow("Presentation time must be between 0 and 120 minutes");
  });
});

describe("present.myPlace — what an attendee's phone sees", () => {
  /** Signs three people up and returns their signup ids, in order. */
  async function seedThree(t: ReturnType<typeof convexTest>, code: string) {
    const ids = [];
    for (const name of ["Aiden", "Janelle", "Hesham"]) {
      ids.push(await t.mutation(api.present.join, { code, name }));
    }
    return ids;
  }

  it("gives an anonymous caller their own number and the size of the room", async () => {
    const t = convexTest(schema, modules);
    const { code } = await startSession(t);
    const [, janelle] = await seedThree(t, code);

    const place = await t.query(api.present.myPlace, { code, signupId: janelle });

    expect(place).toEqual({
      name: "Janelle",
      position: 2,
      total: 3,
      state: "waiting",
      status: "collecting",
      // Nobody is on stage until the admin locks the order.
      currentNumber: null,
      roster: [
        { name: "Aiden", number: 1, isYou: false },
        { name: "Janelle", number: 2, isYou: true },
        { name: "Hesham", number: 3, isYou: false },
      ],
    });
  });

  it("hands back the running order, with the caller's own row flagged", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const [aiden, , hesham] = await seedThree(t, code);

    // The list follows the admin's order, not the order people scanned in.
    const signups = (await admin.query(api.present.activeSession, {}))!.signups;
    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [hesham, ...signups.map((s) => s._id).filter((id) => id !== hesham)],
    });

    const place = await t.query(api.present.myPlace, { code, signupId: aiden });

    expect(place!.roster).toEqual([
      { name: "Hesham", number: 1, isYou: false },
      { name: "Aiden", number: 2, isYou: true },
      { name: "Janelle", number: 3, isYou: false },
    ]);
  });

  it("names whose turn it is, and nobody once the last one is done", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const [aiden, janelle] = await seedThree(t, code);
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });

    const currentFor = async (id: string) =>
      (await t.query(api.present.myPlace, { code, signupId: id }))!.currentNumber;

    // Everyone sees the same figure, whoever is asking.
    expect(await currentFor(aiden)).toBe(1);
    expect(await currentFor(janelle)).toBe(1);

    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 2 });
    expect(await currentFor(aiden)).toBe(3);

    // The pointer is left one past the end when the last presenter is removed,
    // which means nobody is up rather than that the first person is.
    const last = (await admin.query(api.present.activeSession, {}))!.signups[2];
    await admin.mutation(api.present.removeSignup, { id: last._id });
    expect(await currentFor(aiden)).toBeNull();
  });

  it("reports presenting, next and waiting against the running order", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const [aiden, janelle, hesham] = await seedThree(t, code);
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });

    const stateOf = async (id: string) =>
      (await t.query(api.present.myPlace, { code, signupId: id }))!.state;

    // Locking starts at the top of the list.
    expect(await stateOf(aiden)).toBe("presenting");
    expect(await stateOf(janelle)).toBe("next");
    expect(await stateOf(hesham)).toBe("waiting");

    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });

    expect(await stateOf(aiden)).toBe("done");
    expect(await stateOf(janelle)).toBe("presenting");
    expect(await stateOf(hesham)).toBe("next");
  });

  it("follows the admin's order, not the order people scanned in", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const [aiden, , hesham] = await seedThree(t, code);

    // Admin drags Hesham to the top.
    const signups = (await admin.query(api.present.activeSession, {}))!.signups;
    await admin.mutation(api.present.reorder, {
      sessionId,
      orderedIds: [hesham, ...signups.map((s) => s._id).filter((id) => id !== hesham)],
    });

    expect(
      (await t.query(api.present.myPlace, { code, signupId: hesham }))!.position,
    ).toBe(1);
    expect(
      (await t.query(api.present.myPlace, { code, signupId: aiden }))!.position,
    ).toBe(2);
  });

  it("returns null for a stale, malformed, or other-session id", async () => {
    const t = convexTest(schema, modules);
    const { admin, code } = await startSession(t);
    const [aiden] = await seedThree(t, code);

    expect(await t.query(api.present.myPlace, { code, signupId: "not-an-id" })).toBeNull();

    // Removed by the admin: their phone must fall back to the sign-up form.
    await admin.mutation(api.present.removeSignup, { id: aiden });
    expect(await t.query(api.present.myPlace, { code, signupId: aiden })).toBeNull();
  });

  it("stops queueing everyone once the session is finished", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    const [, , hesham] = await seedThree(t, code);
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    // Wrapped up while Hesham, at the bottom, never got a turn.
    await admin.mutation(api.present.setStatus, { sessionId, status: "done" });

    const place = await t.query(api.present.myPlace, { code, signupId: hesham });
    expect(place!.state).toBe("done");
  });

  it("shows nobody as presenting while sign-ups are still open", async () => {
    const t = convexTest(schema, modules);
    const { code } = await startSession(t);
    const [aiden] = await seedThree(t, code);

    const place = await t.query(api.present.myPlace, { code, signupId: aiden });
    expect(place!.state).toBe("waiting");
  });
});

describe("present.setCurrentIndex", () => {
  it("is dropped when the order is reopened, and reset on the next lock", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    for (const name of ["Aiden", "Janelle"]) {
      await t.mutation(api.present.join, { code, name });
    }
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 1 });

    await admin.mutation(api.present.setStatus, { sessionId, status: "collecting" });
    expect(
      (await admin.query(api.present.activeSession, {}))!.currentIndex,
    ).toBeUndefined();

    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    expect((await admin.query(api.present.activeSession, {}))!.currentIndex).toBe(0);
  });

  it("rejects a non-admin, an out-of-range index, and an unlocked session", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, sessionId, code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });

    await expect(
      member.mutation(api.present.setCurrentIndex, { sessionId, index: 0 }),
    ).rejects.toThrow("Admin access required");
    await expect(
      admin.mutation(api.present.setCurrentIndex, { sessionId, index: 0 }),
    ).rejects.toThrow("The order is not locked yet");

    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    await expect(
      admin.mutation(api.present.setCurrentIndex, { sessionId, index: 5 }),
    ).rejects.toThrow("No such presenter");
  });
});

describe("present.addSignup — the name the admin types in", () => {
  it("puts someone who could not scan at the bottom of the list", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });

    await admin.mutation(api.present.addSignup, { sessionId, name: "  Flat Battery  " });

    // Trimmed, and behind the name that was already in.
    expect(await namesInOrder(admin)).toEqual(["Aiden", "Flat Battery"]);
  });

  it("still takes a name once talks are under way, behind everyone waiting", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);

    await admin.mutation(api.present.addSignup, { sessionId, name: "Hand Up At The Back" });

    expect(await namesInOrder(admin)).toEqual([
      "Aiden",
      "Janelle",
      "Hesham",
      "Latecomer",
      "Hand Up At The Back",
    ]);
  });

  it("holds to the same rules as a scan", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });

    await expect(
      admin.mutation(api.present.addSignup, { sessionId, name: "aiden" }),
    ).rejects.toThrow("That name is already on the list");
    await expect(admin.mutation(api.present.addSignup, { sessionId, name: "   " })).rejects.toThrow(
      "Name is required",
    );
    await expect(
      admin.mutation(api.present.addSignup, { sessionId, name: "x".repeat(61) }),
    ).rejects.toThrow("60 characters or fewer");
    expect(await namesInOrder(admin)).toEqual(["Aiden"]);
  });

  it("rejects a non-admin member", async () => {
    const t = convexTest(schema, modules);
    const { member, sessionId } = await startSession(t);

    await expect(
      member.mutation(api.present.addSignup, { sessionId, name: "Sneaky" }),
    ).rejects.toThrow("Admin access required");
  });
});

describe("present clock — one clock, every admin device", () => {
  // Only Date is faked: convex-test's own scheduling still needs real timers.
  const T0 = new Date("2026-10-01T10:00:00.000Z").getTime();
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T0);
  });
  afterEach(() => vi.useRealTimers());

  it("hands the running clock to whoever reads the session next", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);

    await admin.mutation(api.present.startClock, { sessionId });

    // What the organiser's phone gets: a start instant it can subtract from its
    // own wall clock, rather than a figure that was only ever in one browser.
    const session = await sessionState(admin);
    expect(session.clockStartedAt).toBe(T0);
    expect(session.clockElapsedMs).toBeUndefined();
    // Starting the clock is also what pins the presenter against a reorder.
    expect(session.currentStartedAt).toBe(T0);
  });

  it("leaves a clock that is already running alone", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);
    await admin.mutation(api.present.startClock, { sessionId });

    // The second device's tap, a minute in: it must not restart the room's clock.
    vi.setSystemTime(T0 + 60_000);
    await admin.mutation(api.present.startClock, { sessionId });

    expect((await sessionState(admin)).clockStartedAt).toBe(T0);
  });

  it("banks the elapsed time on a pause and picks it up again on resume", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);
    await admin.mutation(api.present.startClock, { sessionId });

    vi.setSystemTime(T0 + 90_000);
    await admin.mutation(api.present.pauseClock, { sessionId });

    const paused = await sessionState(admin);
    expect(paused.clockStartedAt).toBeUndefined();
    expect(paused.clockElapsedMs).toBe(90_000);

    // Resumed ten minutes later: the clock reads 1:30, not 11:30, because the
    // start instant is back-dated by what the pause banked.
    vi.setSystemTime(T0 + 600_000);
    await admin.mutation(api.present.startClock, { sessionId });
    expect((await sessionState(admin)).clockStartedAt).toBe(T0 + 600_000 - 90_000);
  });

  it("puts the clock back to zero on a reset, but keeps the turn under way", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [aiden, janelle, hesham, latecomer] = ids;
    await admin.mutation(api.present.startClock, { sessionId });
    await admin.mutation(api.present.addClockMinute, { sessionId });

    await admin.mutation(api.present.resetClock, { sessionId });

    const session = await sessionState(admin);
    expect(session.clockStartedAt).toBeUndefined();
    expect(session.clockElapsedMs).toBeUndefined();
    expect(session.bonusPresentationMs).toBeUndefined();
    // Janelle has still had her turn started, so she stays pinned.
    expect(session.currentStartedAt).toBe(T0);
    await expect(
      admin.mutation(api.present.reorder, {
        sessionId,
        orderedIds: [janelle, aiden, hesham, latecomer],
      }),
    ).rejects.toThrow("Only people still waiting can be moved");
  });

  it("grants the extra minute to whichever window is running", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);
    await admin.mutation(api.present.startClock, { sessionId });

    // A minute into a three-minute talk.
    vi.setSystemTime(T0 + 60_000);
    await admin.mutation(api.present.addClockMinute, { sessionId });
    expect((await sessionState(admin)).bonusPresentationMs).toBe(60_000);

    // Four minutes in, which — with that extra minute — is now feedback.
    vi.setSystemTime(T0 + 240_000);
    await admin.mutation(api.present.addClockMinute, { sessionId });
    const session = await sessionState(admin);
    expect(session.bonusPresentationMs).toBe(60_000);
    expect(session.bonusFeedbackMs).toBe(60_000);
  });

  it("winds a running clock forward to the handover mark", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);
    await admin.mutation(api.present.startClock, { sessionId });

    vi.setSystemTime(T0 + 30_000);
    await admin.mutation(api.present.skipToFeedback, { sessionId });

    // The three-minute presentation now reads as fully elapsed, and the clock
    // is still running — into the feedback window.
    expect((await sessionState(admin)).clockStartedAt).toBe(T0 + 30_000 - 180_000);

    // A second tap has nothing left to skip.
    await admin.mutation(api.present.skipToFeedback, { sessionId });
    expect((await sessionState(admin)).clockStartedAt).toBe(T0 + 30_000 - 180_000);
  });

  it("skips a paused clock without setting it going", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);

    await admin.mutation(api.present.skipToFeedback, { sessionId });

    const session = await sessionState(admin);
    expect(session.clockStartedAt).toBeUndefined();
    expect(session.clockElapsedMs).toBe(180_000);
    // Moving a talk on is as much a start as pressing Start.
    expect(session.currentStartedAt).toBe(T0);
  });

  it("starts the next presenter on a clock of their own", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId } = await midSession(t);
    await admin.mutation(api.present.startClock, { sessionId });
    await admin.mutation(api.present.addClockMinute, { sessionId });

    vi.setSystemTime(T0 + 200_000);
    await admin.mutation(api.present.setCurrentIndex, { sessionId, index: 2 });

    const session = await sessionState(admin);
    expect(session.clockStartedAt).toBeUndefined();
    expect(session.clockElapsedMs).toBeUndefined();
    expect(session.bonusPresentationMs).toBeUndefined();
    expect(session.currentStartedAt).toBeUndefined();
  });

  it("clears the clock when the presenter is removed, and when setup reopens", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, ids } = await midSession(t);
    const [aiden, janelle] = ids;
    await admin.mutation(api.present.startClock, { sessionId });

    // A removal above the presenter leaves Janelle's own clock running.
    await admin.mutation(api.present.removeSignup, { id: aiden });
    expect((await sessionState(admin)).clockStartedAt).toBe(T0);

    // Removing her hands the stage to Hesham, whose slot has not begun.
    await admin.mutation(api.present.removeSignup, { id: janelle });
    expect((await sessionState(admin)).clockStartedAt).toBeUndefined();

    await admin.mutation(api.present.startClock, { sessionId });
    await admin.mutation(api.present.setStatus, { sessionId, status: "collecting" });
    expect((await sessionState(admin)).clockStartedAt).toBeUndefined();
  });

  it("refuses to run a clock on a session that is not presenting", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, sessionId, code } = await startSession(t);
    await t.mutation(api.present.join, { code, name: "Aiden" });

    // Still collecting names: there is nobody on stage to time.
    await expect(admin.mutation(api.present.startClock, { sessionId })).rejects.toThrow(
      "Talks are not under way",
    );
    await expect(admin.mutation(api.present.addClockMinute, { sessionId })).rejects.toThrow(
      "Talks are not under way",
    );

    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });
    for (const clockMutation of [
      api.present.startClock,
      api.present.pauseClock,
      api.present.resetClock,
      api.present.addClockMinute,
      api.present.skipToFeedback,
    ]) {
      await expect(member.mutation(clockMutation, { sessionId })).rejects.toThrow(
        "Admin access required",
      );
    }
  });
});
