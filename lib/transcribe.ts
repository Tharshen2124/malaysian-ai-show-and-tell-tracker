interface TranscribeOptions {
  /**
   * Condense the talk into the couple of lines that belong in the record.
   *
   * Opt-in, because it is only right for a whole talk. A correction dictated
   * into an update that already exists must come back verbatim: fed to the
   * summariser, "also the demo is on staging not prod" came back as "Mapped the
   * demo to the staging URL instead of production" — an action nobody took.
   */
  summarise?: boolean;
}

/**
 * Sends a recorded clip to the server route, which holds the OpenAI key.
 * Throws with a message fit to show the user.
 */
export async function transcribeAudio(
  blob: Blob,
  extension: string,
  { summarise = false }: TranscribeOptions = {},
): Promise<string> {
  const body = new FormData();
  body.append("file", new File([blob], `dictation.${extension}`, { type: blob.type }));
  if (summarise) body.append("summarise", "1");

  const response = await fetch("/api/transcribe", { method: "POST", body });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Could not transcribe the audio.");
  }
  return ((data?.text as string | undefined) ?? "").trim();
}
