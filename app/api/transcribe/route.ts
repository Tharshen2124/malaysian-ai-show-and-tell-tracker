import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { SUMMARY_SYSTEM_PROMPT, cleanSummary } from "@/lib/summarise";

// OpenAI rejects anything larger, so oversized clips are refused here rather
// than after a pointless upload round-trip.
const MAX_BYTES = 25 * 1024 * 1024;

const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
/** Cheapest tier that follows the brief; a talk costs a fraction of a cent. */
const SUMMARY_MODEL = "gpt-5.4-nano";

/**
 * Condenses a dictated talk into the update that gets stored.
 *
 * Returns the raw transcript unchanged if anything goes wrong. A summariser
 * outage must not cost the scribe the recording — the audio only ever existed
 * in memory, so there is nothing to retry from once this request returns.
 */
async function summariseTranscript(transcript: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        messages: [
          { role: "system", content: SUMMARY_SYSTEM_PROMPT },
          { role: "user", content: transcript },
        ],
      }),
    });
    if (!response.ok) {
      console.error("OpenAI summary failed", response.status, await response.text());
      return transcript;
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return cleanSummary(data.choices?.[0]?.message?.content) ?? transcript;
  } catch (error) {
    console.error("OpenAI summary unreachable", error);
    return transcript;
  }
}

/**
 * Turns a recorded clip into the update text: speech-to-text, then — when the
 * caller sends `summarise=1` — a pass to condense the talk into the couple of
 * lines worth keeping. Both hops happen here so the browser makes one round
 * trip and the key never leaves the server.
 *
 * The route is gated on the same admin check the `updates` mutations use — this
 * spends OpenAI credit, and only admins can save an update in the first place.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!apiKey || !convexUrl) {
    return Response.json({ error: "Transcription is not configured." }, { status: 503 });
  }

  const { getToken, sessionClaims } = await auth();
  // Mirrors how `ConvexProviderWithClerk` asks for its token, so Convex
  // authorizes this request against the members table exactly as it would a
  // query made from the UI. Clerk's built-in Convex integration stamps
  // `aud: "convex"` on the ordinary session token; instances wired up the older
  // way mint one from a JWT template of that name instead.
  const token =
    sessionClaims?.aud === "convex"
      ? await getToken()
      : await getToken({ template: "convex" }).catch(() => null);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);
  const me = await convex.query(api.auth.me, {});
  if (!me?.isAdmin) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No audio was sent." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "That recording is too long. Record it in shorter takes." },
      { status: 413 },
    );
  }

  // Forwarded as multipart; `Content-Type` is deliberately left unset so fetch
  // writes the boundary itself.
  const upstream = new FormData();
  upstream.append("file", file, file.name || "dictation.webm");
  upstream.append("model", "gpt-4o-transcribe");
  upstream.append("response_format", "json");

  let response: Response;
  try {
    response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch {
    return Response.json({ error: "Could not reach the transcription service." }, { status: 502 });
  }

  if (!response.ok) {
    // Upstream errors quote account and key detail, so they stay in the server
    // log and the caller gets a generic message.
    console.error("OpenAI transcription failed", response.status, await response.text());
    return Response.json({ error: "Could not transcribe the audio." }, { status: 502 });
  }

  const data = (await response.json()) as { text?: string };
  const transcript = (data.text ?? "").trim();
  // Nothing to condense, and the caller reports the empty result as "no speech".
  if (!transcript) return Response.json({ text: "" });

  // Opt-in: only a whole talk should be summarised. Anything that forgets to
  // ask gets the transcript back untouched, which is the harmless direction.
  if (form.get("summarise") !== "1") return Response.json({ text: transcript });

  return Response.json({ text: await summariseTranscript(transcript, apiKey) });
}
