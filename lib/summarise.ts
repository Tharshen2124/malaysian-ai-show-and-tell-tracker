/**
 * Turning a dictated talk into the one or two lines that actually belong in the
 * record. Pure helpers only — the API call and the key live in the route.
 */

/** What the model returns when the talk carried no real update. Stored as-is. */
export const NO_UPDATE = "No update given.";

/**
 * Tuned against real rambling transcripts. Three things it is deliberately
 * strict about, each because a looser version got them wrong in testing:
 * subject-dropped active voice (to match the existing updates), never inventing
 * a "next step" nobody mentioned, and keeping unrelated facts in separate
 * sentences so a revert and an unrelated outage don't read as cause and effect.
 */
export const SUMMARY_SYSTEM_PROMPT = `You turn a spoken Show & Tell talk into a written progress update for a project tracker, in British English.

Rules:
- At most three short sentences, under 45 words in total. Prefer one or two.
- Start each sentence with a past-tense verb. Active voice only. The update is filed under the speaker's name, so never write "I", "they", "the speaker", "this week", and never use the passive ("was tested", "performance improved").
- Keep unrelated facts in separate sentences. Never join two things with "and" or "after" in a way that implies one caused the other unless the speaker said so.
- Include only what was actually said: what was built, changed, measured or learned, concrete numbers, and blockers hit. Mention what is planned next ONLY if the speaker explicitly said so. Never invent a next step, a motivation, or a result.
- Drop greetings, sign-offs, thanks, apologies, filler, room or laptop trouble, audience questions, and schedule talk.
- No preamble, no bullet points, no quotation marks.
- If nothing substantive was shared, reply with exactly: ${NO_UPDATE}

Examples:
Talk: "Um so I finally got the auth flow working with Google, took ages because of the redirect URIs. Next week I guess I will look at the mobile layout."
Update: Got the Google auth flow working after wrestling with redirect URIs. Plans to look at the mobile layout next.

Talk: "Yeah so I shipped the billing page, it is live. That is it."
Update: Shipped the billing page; it is live.`;

/** Beyond this the model has ignored the brief; the transcript is kept instead. */
const MAX_SUMMARY_LENGTH = 600;

/**
 * Normalises whatever the model returned, or `null` when it is unusable — an
 * empty answer, or one so long it is clearly a transcript rather than a summary.
 * The caller falls back to the raw transcript rather than losing the recording.
 */
export function cleanSummary(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const text = raw
    .replace(/\s+/g, " ")
    .trim()
    // Models like to wrap a one-liner in quotes despite being told not to.
    // Newlines are already gone above, so `.` covers the whole string.
    .replace(/^["'“”](.*)["'“”]$/, "$1")
    // And to prefix it with a label, despite the same.
    .replace(/^(update|summary)\s*:\s*/i, "")
    .trim();
  if (!text) return null;
  return text.length > MAX_SUMMARY_LENGTH ? null : text;
}
