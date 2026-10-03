"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { Play, QrCode } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { minutesToSeconds, secondsToMinutes } from "@/lib/clock";
import { useAccess } from "@/lib/use-access";
import { serverNow } from "@/lib/use-server-offset";
import { useToast } from "@/components/providers/toast-provider";
import { ClockField } from "@/components/present/clock-field";
import { QrPanel } from "@/components/present/qr-panel";
import { RosterList } from "@/components/present/roster-list";
import { Card } from "@/components/ui/card";
import { PresenterTimer } from "@/components/present/presenter-timer";
import { Button } from "@/components/ui/button";

const DEFAULT_PRESENTATION_MINUTES = 3;
const DEFAULT_FEEDBACK_MINUTES = 2;

/*
 * Start, pause and reset answer a tap on a clock the whole room is watching, so
 * they move it before the round trip rather than after it. The server's own
 * timestamps land a moment later and win — within the latency of one mutation,
 * so the figure does not visibly jump. The guesses are stamped on server time
 * (`serverNow`), so a device whose own clock is off does not make that jump any
 * bigger. Each mirrors its mutation in `convex/present.ts`, including declining
 * to restart a clock that is already running, so the two cannot disagree while
 * the write is in flight.
 *
 * Granting a minute and skipping to feedback are deliberately left to the
 * server: both turn on which phase is running, and that is a judgement only one
 * of the room's devices should be making.
 */
function patchSession(
  localStore: OptimisticLocalStore,
  patch: (session: NonNullable<ActiveSession>) => Partial<NonNullable<ActiveSession>> | null,
) {
  const current = localStore.getQuery(api.present.activeSession, {});
  if (!current) return;
  const next = patch(current);
  if (next) localStore.setQuery(api.present.activeSession, {}, { ...current, ...next });
}

type ActiveSession = FunctionReturnType<typeof api.present.activeSession>;

const startedClock = (localStore: OptimisticLocalStore) =>
  patchSession(localStore, (session) => {
    if (session.clockStartedAt !== undefined) return null;
    const now = serverNow();
    return {
      clockStartedAt: now - (session.clockElapsedMs ?? 0),
      // Starting the clock is also what pins the presenter against a reorder.
      currentStartedAt: session.currentStartedAt ?? now,
    };
  });

const pausedClock = (localStore: OptimisticLocalStore) =>
  patchSession(localStore, (session) =>
    session.clockStartedAt === undefined
      ? null
      : {
          clockStartedAt: undefined,
          clockElapsedMs: Math.max(0, serverNow() - session.clockStartedAt),
        },
  );

const clearedClock = (localStore: OptimisticLocalStore) =>
  patchSession(localStore, () => ({
    clockStartedAt: undefined,
    clockElapsedMs: undefined,
    bonusPresentationMs: undefined,
    bonusFeedbackMs: undefined,
  }));

/** Rejections from `insertSignup` worth repeating to the admin verbatim;
 *  anything else is a bug or an outage and gets the generic line. */
const ADD_REJECTIONS = [
  "That name is already on the list",
  "This session is full",
  "Sign-ups are closed",
];

export default function PresentPage() {
  const router = useRouter();
  const toast = useToast();
  const { isLoading, isAdmin } = useAccess();

  const session = useQuery(api.present.activeSession, isAdmin ? {} : "skip");
  const createSession = useMutation(api.present.createSession);
  const addSignup = useMutation(api.present.addSignup);
  const removeSignup = useMutation(api.present.removeSignup);
  const setStatus = useMutation(api.present.setStatus);
  const setCurrentIndex = useMutation(api.present.setCurrentIndex);
  const updateDurations = useMutation(api.present.updateDurations);
  const addClockMinute = useMutation(api.present.addClockMinute);
  const skipToFeedback = useMutation(api.present.skipToFeedback);

  // Dragging a row must move it now, not after a round trip, or it snaps back
  // under the cursor. Convex reconciles this against the server's answer.
  const reorder = useMutation(api.present.reorder).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.present.activeSession, {});
    if (!current) return;
    const byId = new Map(current.signups.map((s) => [s._id, s]));
    const signups = args.orderedIds.flatMap((id, i) => {
      const row = byId.get(id);
      return row ? [{ ...row, position: i }] : [];
    });
    localStore.setQuery(api.present.activeSession, {}, { ...current, signups });
  });

  const startClock = useMutation(api.present.startClock).withOptimisticUpdate(startedClock);
  const pauseClock = useMutation(api.present.pauseClock).withOptimisticUpdate(pausedClock);
  const resetClock = useMutation(api.present.resetClock).withOptimisticUpdate(clearedClock);

  // Only admins run the room; members get sent back rather than shown a
  // half-working console.
  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/dashboard");
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) return null;

  const heading = (
    <div>
      <h1 className="text-3xl tracking-tight">So, who presents first?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Put the QR code on the screen, let people scan in, set the order, then run the clock. The
        code stays up during the talks for anyone who turns up late.
      </p>
    </div>
  );

  const start = async () => {
    try {
      await createSession({
        presentationMinutes: DEFAULT_PRESENTATION_MINUTES,
        feedbackMinutes: DEFAULT_FEEDBACK_MINUTES,
      });
    } catch {
      toast.error("Could not start a session.");
    }
  };

  if (session === undefined) {
    return (
      <div className="space-y-8">
        {heading}
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="space-y-8">
        {heading}
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <QrCode className="h-9 w-9 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Start a session to put a QR code on the screen. Everyone in the room scans it and adds
            their own name.
          </p>
          <Button
            onClick={start}
            variant="default"
            className="hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
          >
            Start a session
          </Button>
        </div>
      </div>
    );
  }

  // "locked" is the stored name for talks being under way; sign-ups and the
  // queue behind the current talk both stay open.
  const presenting = session.status === "locked";
  // One past the end is allowed and meaningful: the last presenter was removed,
  // so everyone has had a turn and the next person to scan in goes straight up.
  const currentIndex = Math.min(Math.max(session.currentIndex ?? 0, 0), session.signups.length);
  const presenterId = session.signups[currentIndex]?._id ?? "nobody";
  // Until the clock is set going, whoever is up is still just the next name on
  // the list, and the roster will let them be moved.
  const currentStarted = session.currentStartedAt !== undefined;

  const beginTalks = async () => {
    try {
      await setStatus({ sessionId: session._id, status: "locked" });
    } catch {
      toast.error("Could not start the presentations.");
    }
  };

  /** Shared by every clock control: a failure is a toast, never a thrown tap. */
  const clockAction = (run: () => Promise<unknown>) => () => {
    run().catch((e: unknown) => {
      // The one rejection that is not a connection problem: another admin
      // device took the session back to setup while this one was still timing.
      const raw = e instanceof Error ? e.message : "";
      toast.error(
        raw.includes("Talks are not under way")
          ? "The talks aren't running any more — someone went back to setup."
          : "Could not reach the clock. Check the connection and try again.",
      );
    });
  };

  // One tree for both phases, so the QR code stays put, without a flicker, when
  // the talks start.
  return (
    <div className="space-y-6 sm:space-y-8">
      {!presenting && heading}

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        {/* Below the controls on a narrow screen, where the clock and the order
            are what the admin needs; during setup only on a phone, since a
            tablet still has room to show the code first. */}
        <div className={presenting ? "max-lg:order-last" : "max-sm:order-last"}>
          <QrPanel code={session.code} />
        </div>

        <div className="space-y-6">
          {presenting && (
            <PresenterTimer
              // A fresh clock whenever someone new is on stage — including when
              // the presenter is removed, or another admin's tab moves things on.
              key={presenterId}
              order={session.signups}
              currentIndex={currentIndex}
              onAdvance={async (index) => {
                try {
                  await setCurrentIndex({ sessionId: session._id, index });
                } catch {
                  toast.error("Could not move to the next presenter.");
                }
              }}
              clock={session}
              onStart={clockAction(() => startClock({ sessionId: session._id }))}
              onPause={clockAction(() => pauseClock({ sessionId: session._id }))}
              onReset={clockAction(() => resetClock({ sessionId: session._id }))}
              onAddMinute={clockAction(() => addClockMinute({ sessionId: session._id }))}
              onSkipToFeedback={clockAction(() => skipToFeedback({ sessionId: session._id }))}
              presentationMinutes={session.presentationMinutes}
              feedbackMinutes={session.feedbackMinutes}
              onReopen={async () => {
                try {
                  await setStatus({ sessionId: session._id, status: "collecting" });
                } catch {
                  toast.error("Could not go back to setup.");
                }
              }}
              onFinish={async () => {
                try {
                  await setStatus({ sessionId: session._id, status: "done" });
                  toast.success("Session finished.");
                } catch {
                  toast.error("Could not finish the session.");
                }
              }}
            />
          )}

          <RosterList
            signups={session.signups}
            currentIndex={presenting ? currentIndex : undefined}
            currentStarted={currentStarted}
            onReorder={async (orderedIds: Id<"presentSignups">[]) => {
              try {
                await reorder({ sessionId: session._id, orderedIds });
              } catch {
                toast.error("Could not save the order — refresh and try again.");
              }
            }}
            onRemove={async (id) => {
              try {
                await removeSignup({ id });
              } catch {
                toast.error("Could not remove that name.");
              }
            }}
            onAdd={async (name) => {
              try {
                await addSignup({ sessionId: session._id, name });
                return true;
              } catch (e) {
                // Convex wraps a thrown message in request-id and stack noise,
                // so the known rejections are matched out of it.
                const raw = e instanceof Error ? e.message : "";
                toast.error(
                  ADD_REJECTIONS.find((m) => raw.includes(m)) ?? "Could not add that name.",
                );
                return false;
              }
            }}
          />

          {!presenting && (
            <>
              <DurationSetter
                presentationSeconds={minutesToSeconds(session.presentationMinutes)}
                feedbackSeconds={minutesToSeconds(session.feedbackMinutes)}
                onCommit={async (presentation, feedback) => {
                  try {
                    await updateDurations({
                      sessionId: session._id,
                      presentationMinutes: secondsToMinutes(presentation),
                      feedbackMinutes: secondsToMinutes(feedback),
                    });
                  } catch {
                    toast.error("Could not save the timings.");
                  }
                }}
              />

              <Button
                onClick={beginTalks}
                disabled={session.signups.length === 0}
                variant="default"
                className="w-full py-3"
              >
                <Play className="h-4 w-4" />
                Start presentations
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The two slot lengths, set in the same mm:ss the running clock is read in —
 * big enough to be the obvious thing to adjust before pressing Start, which
 * two small "min" boxes never were.
 */
function DurationSetter({
  presentationSeconds,
  feedbackSeconds,
  onCommit,
}: {
  presentationSeconds: number;
  feedbackSeconds: number;
  onCommit: (presentationSeconds: number, feedbackSeconds: number) => void;
}) {
  return (
    <Card className="gap-0 p-4">
      <h2 className="mb-3 text-xs font-medium text-muted-foreground">Time per person</h2>
      <div className="flex gap-3">
        <ClockField
          label="Presentation"
          seconds={presentationSeconds}
          onCommit={(seconds) => onCommit(seconds, feedbackSeconds)}
        />
        <ClockField
          label="Feedback"
          seconds={feedbackSeconds}
          onCommit={(seconds) => onCommit(presentationSeconds, seconds)}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Minutes and seconds — type 3 0 0 for three minutes. One chime hands over to feedback; three
        lower ones end the slot.
      </p>
    </Card>
  );
}
