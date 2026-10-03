"use client";

import { formatClock } from "@/lib/clock";
import { cn } from "@/lib/utils";
import { SharedClock, usePresenterTimer } from "@/lib/use-presenter-timer";

/** The slot clock as `present.myPlace` hands it to a phone. */
export interface SlotClock extends SharedClock {
  presentationMinutes: number;
  feedbackMinutes: number;
}

/**
 * The projector's clock, on an attendee's phone. Read-only: the organiser runs
 * it, and this only shows it — biggest for the person on stage, who can glance
 * down at it mid-talk instead of craning round at the screen.
 *
 * Silent on purpose. The chimes come from the projector; a roomful of phones
 * echoing them would drown it out. The timer's own audio is never unlocked
 * here, so its `chime` does nothing.
 */
export function AttendeeClock({
  clock,
  presenterName,
  isYou,
}: {
  clock: SlotClock;
  presenterName: string;
  isYou: boolean;
}) {
  const timer = usePresenterTimer(clock.presentationMinutes, clock.feedbackMinutes, clock);
  const feedback = timer.phase === "feedback";
  const notStarted = !timer.running && clock.clockElapsedMs === undefined;

  const tone = timer.overrun
    ? "border-danger-line bg-danger-soft"
    : feedback
      ? "border-info-line bg-info-soft"
      : "border-border bg-card shadow-card";

  const status = notStarted ? "Not started" : timer.running ? null : "Paused";

  return (
    <section
      aria-label="Time left"
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-6 py-6 text-center transition-colors duration-300",
        tone,
      )}
    >
      <p className="text-[0.8125rem] leading-snug font-semibold text-muted-foreground">
        {isYou ? "Your time" : presenterName}
      </p>

      {/* platform-design.md's badge: a pill on the tint, or on the accent's selection wash. */}
      <p
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
          feedback ? "bg-selection text-info" : "bg-secondary text-muted-foreground",
        )}
      >
        {feedback ? "Feedback" : "Presentation"} · {formatClock(timer.phaseSeconds)}
        {status && <span className="font-normal opacity-75">· {status}</span>}
      </p>

      <p
        className={cn(
          "leading-none font-bold tracking-[-0.02em] tabular-nums",
          isYou ? "text-[clamp(4.5rem,26vw,7rem)]" : "text-[clamp(3rem,16vw,4.5rem)]",
          timer.overrun ? "text-danger" : "text-foreground",
        )}
      >
        {formatClock(timer.secondsLeft)}
      </p>

      {timer.overrun && (
        <p role="alert" className="text-sm text-danger">
          {isYou ? "Time's up — please wrap up." : "This slot is over time."}
        </p>
      )}
    </section>
  );
}
