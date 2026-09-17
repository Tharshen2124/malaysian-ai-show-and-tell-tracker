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
import { formatClock, usePresenterTimer } from "@/lib/use-presenter-timer";
import { useWakeLock } from "@/lib/use-wake-lock";
import { buttonClass } from "@/components/ui/button";
import type { Signup } from "./roster-list";

interface PresenterTimerProps {
  order: Signup[];
  /**
   * Whose turn it is, clamped to 0..order.length — one past the end means
   * nobody is on stage. Held on the session so attendees' phones can see it too.
   */
  currentIndex: number;
  onAdvance: (index: number) => void;
  /** Whether the clock has already been set going for this slot. */
  started: boolean;
  /**
   * Report that the slot is under way. This is what pins the person on stage
   * against `present.reorder`, so it goes to the server even though the clock
   * itself stays local to this browser.
   */
  onStart: () => void;
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
  started,
  onStart,
  presentationMinutes,
  feedbackMinutes,
  onReopen,
  onFinish,
}: PresenterTimerProps) {
  const timer = usePresenterTimer(presentationMinutes, feedbackMinutes);
  // Only worth holding while the clock is actually running.
  useWakeLock(timer.running);

  const isLast = current >= order.length - 1;
  const presenter = order[current];

  // Sent once per presenter: pausing and resuming is still the same slot, and
  // the mutation is idempotent anyway.
  const markStarted = () => {
    if (!started) onStart();
  };

  const nextPresenter = () => {
    // Advancing is what tells the next person's phone to buzz, so it goes to the
    // server; the clock stays local.
    if (!isLast) onAdvance(current + 1);
    timer.reset();
  };

  // Nobody on stage: the list was emptied, or the last presenter was removed.
  // The QR is still up, so the next person to scan in picks up from here.
  if (!presenter) {
    const everyoneHadATurn = order.length > 0;
    return (
      <div className="space-y-5 rounded-panel border-[1.5px] border-dashed border-hairline px-6 py-10 text-center">
        <p className="text-sm text-muted">
          {everyoneHadATurn
            ? "That's everyone on the list. Anyone who scans in now goes straight up."
            : "Nobody is on the list right now. The next person to scan in goes first."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={onReopen} className={buttonClass("outline")}>
            <ArrowLeft className="h-4 w-4" />
            Back to setup
          </button>
          {everyoneHadATurn && (
            <button onClick={onFinish} className={buttonClass("success-outline")}>
              <CheckCircle2 className="h-4 w-4" />
              Finish session
            </button>
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
      : "border-hairline bg-card";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onReopen}
          title="Back to setting the order and timings. Talks restart from the top."
          className="inline-flex items-center gap-1.5 text-[0.82rem] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to setup
        </button>
        <p className="text-sm text-faint tabular-nums">
          {current + 1} of {order.length}
        </p>
      </div>

      <div className={`rounded-panel border-[1.5px] p-8 text-center transition-colors duration-300 ${tone}`}>
        <p className="kicker">Now presenting</p>
        <p className="mt-2 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold tracking-[-0.01em] text-heading text-balance">
          {presenter.name}
        </p>

        <p
          className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
            feedback ? "border-info-line text-info" : "border-hairline text-muted"
          }`}
        >
          {feedback
            ? `Feedback · ${feedbackMinutes} min`
            : `Presentation · ${presentationMinutes} min`}
        </p>

        <p
          aria-live="polite"
          className={`display-figure my-6 text-[clamp(4.5rem,12vw,8rem)] leading-none ${
            timer.overrun ? "text-danger" : "text-heading"
          }`}
        >
          {formatClock(timer.secondsLeft)}
        </p>

        {timer.overrun && (
          <p role="alert" className="mb-5 text-sm text-danger">
            The slot is over — time to wrap up with {presenter.name}.
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              // Starting, not pausing, is what commits the running order.
              if (!timer.running) markStarted();
              timer.toggle();
            }}
            className={buttonClass("primary")}
          >
            {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {timer.running ? "Pause" : "Start"}
          </button>
          <button onClick={timer.addMinute} className={buttonClass("outline")}>
            <Plus className="h-4 w-4" />1 minute
          </button>
          <button
            onClick={() => {
              // Jumping straight to feedback still means the slot has begun.
              markStarted();
              timer.skipToFeedback();
            }}
            disabled={feedback}
            className={buttonClass("outline")}
            title="Jump to the feedback window without waiting out the clock"
          >
            <FastForward className="h-4 w-4" />
            Feedback now
          </button>
          <button onClick={timer.reset} className={buttonClass("outline")}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          {isLast ? (
            <button onClick={onFinish} className={buttonClass("success-outline")}>
              <CheckCircle2 className="h-4 w-4" />
              Finish session
            </button>
          ) : (
            <button onClick={nextPresenter} className={buttonClass("outline")}>
              <SkipForward className="h-4 w-4" />
              Next presenter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
