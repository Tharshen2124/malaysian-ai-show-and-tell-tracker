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
  /** Whose turn it is. Held on the session so attendees' phones can see it too. */
  currentIndex: number;
  onAdvance: (index: number) => void;
  presentationMinutes: number;
  feedbackMinutes: number;
  /** Reopen sign-ups and go back to arranging the order. */
  onReopen: () => void;
  onFinish: () => void;
}

export function PresenterTimer({
  order,
  currentIndex,
  onAdvance,
  presentationMinutes,
  feedbackMinutes,
  onReopen,
  onFinish,
}: PresenterTimerProps) {
  // Clamped: a name removed mid-session must not leave the pointer past the end.
  const current = Math.min(Math.max(currentIndex, 0), Math.max(order.length - 1, 0));
  const timer = usePresenterTimer(presentationMinutes, feedbackMinutes);
  // Only worth holding while the clock is actually running.
  useWakeLock(timer.running);

  const isLast = current >= order.length - 1;
  const presenter = order[current];

  const nextPresenter = () => {
    // Advancing is what tells the next person's phone to buzz, so it goes to the
    // server; the clock stays local.
    if (!isLast) onAdvance(current + 1);
    timer.reset();
  };

  if (!presenter) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted">Nobody signed up for this session.</p>
        <button onClick={onReopen} className={buttonClass("outline")}>
          <ArrowLeft className="h-4 w-4" />
          Reopen sign-ups
        </button>
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
          className="inline-flex items-center gap-1.5 text-[0.82rem] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Reopen sign-ups
        </button>
        <p className="text-sm text-faint tabular-nums">
          {current + 1} of {order.length}
        </p>
      </div>

      <div className={`rounded-panel border-[1.5px] p-8 text-center transition-colors duration-300 ${tone}`}>
        <p className="kicker">Now presenting</p>
        <p className="mt-2 font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.9] tracking-[-0.035em] text-heading text-balance">
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
          <button onClick={timer.toggle} className={buttonClass("primary")}>
            {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {timer.running ? "Pause" : "Start"}
          </button>
          <button onClick={timer.addMinute} className={buttonClass("outline")}>
            <Plus className="h-4 w-4" />1 minute
          </button>
          <button
            onClick={timer.skipToFeedback}
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

      <section>
        <h2 className="kicker mb-3">Up next</h2>
        {isLast ? (
          <p className="text-sm text-faint">Nobody left — that was the last talk.</p>
        ) : (
          <ol className="space-y-1.5">
            {order.slice(current + 1).map((signup, i) => (
              <li
                key={signup._id}
                className="rounded-media border-[1.5px] border-hairline bg-card px-4 py-2.5 text-sm"
              >
                <span className="mr-2 text-faint tabular-nums">{current + i + 2}.</span>
                {signup.name}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
