"use client";

import { use, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { ErrorState, InlineErrorBanner } from "@/components/ui/error-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { Wordmark } from "@/components/ui/wordmark";
import { AttendeePlace } from "@/components/present/attendee-place";
import { useChime } from "@/lib/use-chime";
import { useWakeLock } from "@/lib/use-wake-lock";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "That name is too long"),
});

/** Server rejections worth repeating to the attendee verbatim; anything else is
 *  a bug or an outage and gets the generic line. Keep in step with `present.join`. */
const JOIN_REJECTIONS = [
  "That name is already on the list",
  "Sign-ups are closed",
  "This session is full",
  "Unknown session",
];

/** Per-session, so scanning a new QR next week doesn't resurrect an old place. */
const storageKey = (code: string) => `showtell:signup:${code.toUpperCase()}`;

function readStoredSignup(code: string): string | null {
  try {
    return localStorage.getItem(storageKey(code));
  } catch {
    // Private mode, or site data blocked. They can sign up again.
    return null;
  }
}

// localStorage is not reactive, so it is exposed as a tiny store: writes tell
// the page to re-read. Reading through useSyncExternalStore (rather than an
// effect that calls setState) keeps the server render and the first client
// render in step, so there is no hydration mismatch and no flash of the form
// in front of someone who signed up ten minutes ago.
const storageListeners = new Set<() => void>();

function subscribeStorage(onChange: () => void) {
  storageListeners.add(onChange);
  window.addEventListener("storage", onChange); // another tab of this page
  return () => {
    storageListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeStoredSignup(code: string, id: string) {
  try {
    localStorage.setItem(storageKey(code), id);
  } catch {
    // Their place still shows for this page view; a reload would lose it.
  }
  storageListeners.forEach((notify) => notify());
}

const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** Deliberately outside the (dashboard) group: its layout would bounce every
 *  attendee to /login. Scanning the QR is the only credential needed here. */
export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = use(params);
  const session = useQuery(api.present.sessionByCode, { code });
  const join = useMutation(api.present.join);
  const { ensureAudio } = useChime();

  const hydrated = useSyncExternalStore(neverChanges, onClient, onServer);
  const storedId = useSyncExternalStore(subscribeStorage, () => readStoredSignup(code), () => null);
  // Covers the phone whose storage write was refused: the id still lives for
  // this page view even though nothing was persisted.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const signupId = storedId ?? sessionId;

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Their own place in the queue. Skipped until we know whether they have one.
  // A `null` answer means the id is stale — an old session, or a name the admin
  // has since removed — and simply falls through to the sign-up form below.
  const place = useQuery(api.present.myPlace, signupId ? { code, signupId } : "skip");

  // A phone that has gone to sleep cannot buzz, chime, or raise the "you're up
  // next" popup, so the screen is held awake from the moment they have a place
  // until their turn has been and gone. A no-op where it is unsupported.
  useWakeLock(place != null && place.state !== "done");

  // Phones will not play a sound that no gesture ever asked for. Submitting is
  // the obvious gesture; this covers the case where they reopen the page later,
  // by unlocking on the first touch anywhere.
  useEffect(() => {
    const unlock = () => ensureAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [ensureAudio]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      // Unlock audio inside the gesture that submitted the form, so the
      // "you're next" alert can fire later on its own.
      ensureAudio();
      const parsed = schema.safeParse({ name });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      setPending(true);
      try {
        const id = await join({ code, name: parsed.data.name });
        writeStoredSignup(code, id);
        setSessionId(id);
      } catch (e) {
        // Convex wraps a thrown message in request-id and stack noise, so the
        // known rejections are matched out of it rather than shown raw.
        const raw = e instanceof Error ? e.message : "";
        setError(JOIN_REJECTIONS.find((m) => raw.includes(m)) ?? "Could not add your name. Try again.");
      } finally {
        setPending(false);
      }
    },
    [name, code, join, ensureAudio],
  );

  const loading =
    session === undefined || !hydrated || (signupId !== null && place === undefined);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <Wordmark />
        <h1 className="mt-5 text-[2rem]">Who presents first?</h1>
      </div>

      {loading && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking the session…
        </p>
      )}

      {!loading && session === null && (
        <ErrorState message="That link is not valid. Check the code on the screen, or scan the QR code again." />
      )}

      {!loading && session && place && <AttendeePlace place={place} />}

      {!loading && session && !place && session.status === "done" && (
        <Card className="items-center gap-3 px-6 py-12 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign-ups are closed — this session has wrapped up. Have a word with an organiser if you
            still want a slot.
          </p>
        </Card>
      )}

      {/* Still open once talks have started: latecomers join the back of the queue. */}
      {!loading && session && !place && session.status !== "done" && (
        <Card className="gap-0 p-5 sm:p-6">
          <form onSubmit={submit} className="grid gap-4">
            {error && <InlineErrorBanner message={error} />}
            <Field label="Your name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                // Sized and hinted for a phone held one-handed in a dim room.
                autoFocus
                autoCapitalize="words"
                autoComplete="name"
                enterKeyHint="done"
                maxLength={60}
                placeholder="e.g. Aiden"
                className="h-12 text-lg md:text-lg"
              />
            </Field>
            <SubmitButton pending={pending} className="h-12 w-full text-base">
              Add me to the list
            </SubmitButton>
            <p className="text-center text-xs text-muted-foreground">
              {session.signupCount} {session.signupCount === 1 ? "person is" : "people are"} in so
              far.
            </p>
          </form>
        </Card>
      )}
    </main>
  );
}
