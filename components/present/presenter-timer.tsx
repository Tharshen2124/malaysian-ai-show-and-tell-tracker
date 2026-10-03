"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FastForward,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { formatClock } from "@/lib/clock";
import { SharedClock, usePresenterTimer } from "@/lib/use-presenter-timer";
import { useWakeLock } from "@/lib/use-wake-lock";
import { Button } from "@/components/ui/button";
import type { Signup } from "./roster-list";

interface PresenterTimerProps {
  order: Signup[];
  /**
   * Whose turn it is, clamped to 0..order.length — one past the end means
   * nobody is on stage. Held on the session so attendees' phones can see it too.
   */
  currentIndex: number;
  onAdvance: (index: number) => void;
  /**
   * The clock, as the session row describes it. Every control below writes it
   * back to the session, so a second admin device — the phone in the
   * organiser's hand — shows and drives the same clock as the projector.
   */
  clock: SharedClock;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAddMinute: () => void;
  onSkipToFeedback: () => void;
  presentationMinutes: number;
  feedbackMinutes: number;
  /** Stop the talks and go back to setting the order and timings. */
  onReopen: () => void;
  onFinish: () => void;
}

export function PresenterTimer({
  order,
  currentIndex: current,
  onAdvance,
  clock,
  onStart,
  onPause,
  onReset,
  onAddMinute,
  onSkipToFeedback,
  presentationMinutes,
  feedbackMinutes,
  onReopen,
  onFinish,
}: PresenterTimerProps) {
  const timer = usePresenterTimer(presentationMinutes, feedbackMinutes, clock);
  // Only worth holding while the clock is actually running.
  useWakeLock(timer.running);

  const isLast = current >= order.length - 1;
  const presenter = order[current];

  // Nobody on stage: the list was emptied, or the last presenter was removed.
  // The QR is still up, so the next person to scan in picks up from here.
  if (!presenter) {
    const everyoneHadATurn = order.length > 0;
    return (
      <div className="space-y-5 rounded-xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {everyoneHadATurn
            ? "That's everyone on the list. Anyone who scans in now goes straight up."
            : "Nobody is on the list right now. The next person to scan in goes first."}
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-sm:flex-col">
          <Button onClick={onReopen} variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to setup
          </Button>
          {everyoneHadATurn && (
            <Button
              onClick={onFinish}
              variant="outline"
              className="border-success-line text-success hover:bg-success-soft"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finish session
            </Button>
          )}
        </div>
      </div>
    );
  }

  const feedback = timer.phase === "feedback";
  const tone = timer.overrun
    ? "border-danger-line bg-danger-soft"
    : feedback
      ? "border-info-line bg-info-soft"
      : "border-border bg-card";

  // Every control writes the session, so the sound has to be unlocked on
  // whichever device was tapped — a chime cannot be handed over the wire.
  const act = (run: () => void) => () => {
    timer.ensureAudio();
    run();
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onReopen}
          title="Back to setting the order and timings. Talks restart from the top."
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground max-sm:min-h-11"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to setup
        </button>
        <p className="text-sm text-muted-foreground tabular-nums">
          {current + 1} of {order.length}
        </p>
      </div>

      <div
        className={`rounded-xl border p-5 text-center transition-colors duration-300 sm:p-8 ${tone}`}
      >
        <p className="text-xs font-medium text-muted-foreground">Now presenting</p>
        <p className="mt-2 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold tracking-[-0.01em] text-foreground text-balance">
          {presenter.name}
        </p>

        <p
          className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs tabular-nums ${
            feedback ? "border-info-line text-info" : "border-border text-muted-foreground"
          }`}
        >
          {feedback ? "Feedback" : "Presentation"} · {formatClock(timer.phaseSeconds)}
        </p>

        <p
          aria-live="polite"
          className={`display-figure my-4 text-[clamp(4.5rem,12vw,8rem)] sm:my-6 leading-none ${
            timer.overrun ? "text-danger" : "text-foreground"
          }`}
        >
          {formatClock(timer.secondsLeft)}
        </p>

        {timer.overrun && (
          <p role="alert" className="mb-5 text-sm text-danger">
            The slot is over — time to wrap up with {presenter.name}.
          </p>
        )}

        {/* On a phone this is the organiser's remote: Start/Pause as one wide
            thumb target, the rest in an even two-up grid rather than a ragged
            wrap of mixed widths. From sm up it goes back to a single row. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
          <Button
            onClick={act(timer.running ? onPause : onStart)}
            variant="default"
            className="col-span-2 max-sm:min-h-14 max-sm:text-base"
          >
            {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {timer.running ? "Pause" : "Start"}
          </Button>
          <Button onClick={act(onAddMinute)} variant="outline">
            <Plus className="h-4 w-4" />1 minute
          </Button>
          <Button
            onClick={act(onSkipToFeedback)}
            disabled={feedback}
            variant="outline"
            title="Jump to the feedback window without waiting out the clock"
          >
            <FastForward className="h-4 w-4" />
            Feedback now
          </Button>
          <Button onClick={act(onReset)} variant="outline">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          {isLast ? (
            <Button
              onClick={onFinish}
              variant="outline"
              className="border-success-line text-success hover:bg-success-soft"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finish session
            </Button>
          ) : (
            <Button onClick={act(() => onAdvance(current + 1))} variant="outline">
              <SkipForward className="h-4 w-4" />
              Next presenter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
