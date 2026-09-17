import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const projectCategoryValidator = v.union(v.literal("solo"), v.literal("group"));

/**
 * Who may use the app. Absent means the person is on the community roster but
 * cannot sign in — that is the default for everyone.
 */
export const accessLevelValidator = v.union(v.literal("member"), v.literal("admin"));

/** Where a Scan & Order session is in its life: collecting names, then presenting. */
export const presentStatusValidator = v.union(
  v.literal("collecting"), // the QR is up and phones may submit
  // Talks under way. The name predates it, but phones may still submit and the
  // queue behind the current talk may still be rearranged.
  v.literal("locked"),
  v.literal("done"),
);

// created_at is covered by Convex's built-in _creationTime; updatedAt is
// maintained by every mutation that writes the row.
export default defineSchema({
  members: defineTable({
    name: v.string(),
    email: v.string(), // always stored lowercase; it is the Google identity key
    isActive: v.boolean(),
    registerDate: v.string(), // YYYY-MM-DD
    accessLevel: v.optional(accessLevelValidator),
    updatedAt: v.number(), // epoch ms
  })
    .index("by_name", ["name"])
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name", filterFields: ["isActive"] }),

  meetups: defineTable({
    date: v.string(), // YYYY-MM-DD
    number: v.number(),
    updatedAt: v.number(),
  }).index("by_date", ["date"]),

  projects: defineTable({
    name: v.string(),
    category: projectCategoryValidator, // "solo" | "group"
    completed: v.boolean(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    memberId: v.id("members"),
  })
    .index("by_project", ["projectId"])
    .index("by_member", ["memberId"])
    .index("by_project_and_member", ["projectId", "memberId"]),

  updates: defineTable({
    meetupId: v.id("meetups"),
    projectId: v.id("projects"),
    memberId: v.id("members"),
    description: v.string(),
    updatedAt: v.number(),
  })
    .index("by_meetup", ["meetupId"])
    .index("by_member", ["memberId"])
    .index("by_project", ["projectId"])
    .index("by_member_and_meetup", ["memberId", "meetupId"]),

  // Scan & Order: a QR goes up, phones add names, the admin sets the order, then
  // each person is timed. Standalone — deliberately not tied to a meetup row.
  presentSessions: defineTable({
    // Short code embedded in the QR URL. Holding it is what lets an unauthenticated
    // phone write to this session — and only this one.
    code: v.string(),
    status: presentStatusValidator,
    presentationMinutes: v.number(),
    feedbackMinutes: v.number(),
    // Whose turn it is, as an index into the ordered roster. Shared so an
    // attendee's phone can tell them they are next; the clock itself stays
    // local to the admin's browser. Absent until the order is locked.
    currentIndex: v.optional(v.number()),
    // When the admin first started the clock on the current slot. Absent means
    // the person at `currentIndex` is up but has not begun, which is what lets
    // `present.reorder` still move them. Cleared whenever the turn pointer moves.
    currentStartedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  presentSignups: defineTable({
    sessionId: v.id("presentSessions"),
    name: v.string(),
    // Contiguous 0..n-1, rewritten wholesale on reorder. With a roomful of people
    // that beats fractional indexing and cannot drift out of order.
    position: v.number(),
    updatedAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
