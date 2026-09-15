import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
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

  it("rejects a name once the order is locked", async () => {
    const t = convexTest(schema, modules);
    const { admin, sessionId, code } = await startSession(t);
    await admin.mutation(api.present.setStatus, { sessionId, status: "locked" });

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
    });
  });

  it("never discloses anyone else's name", async () => {
    const t = convexTest(schema, modules);
    const { code } = await startSession(t);
    const [aiden] = await seedThree(t, code);

    const place = await t.query(api.present.myPlace, { code, signupId: aiden });

    expect(JSON.stringify(place)).not.toContain("Janelle");
    expect(JSON.stringify(place)).not.toContain("Hesham");
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
