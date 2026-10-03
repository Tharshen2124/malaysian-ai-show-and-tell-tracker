"use client";

import { formatClock } from "@/lib/clock";
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
      : "border-hairline bg-paper";

  const status = notStarted ? "Not started" : timer.running ? null : "Paused";

  return (
    <section
      aria-label="Time left"
      className={`flex flex-col items-center gap-2 rounded-panel border-[1.5px] px-6 py-6 text-center transition-colors duration-300 ${tone}`}
    >
      <p className="kicker">
        {isYou ? "Your time" : <span className="normal-case tracking-normal">{presenterName}</span>}
      </p>

      <p
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs tabular-nums ${
          feedback ? "border-info-line text-info" : "border-hairline text-ink-muted"
        }`}
      >
        {feedback ? "Feedback" : "Presentation"} · {formatClock(timer.phaseSeconds)}
        {status && <span className="text-faint">· {status}</span>}
      </p>

      <p
        className={`display-figure leading-none ${
          isYou ? "text-[clamp(4.5rem,26vw,7rem)]" : "text-[clamp(3rem,16vw,4.5rem)]"
        } ${timer.overrun ? "text-danger" : "text-heading"}`}
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
