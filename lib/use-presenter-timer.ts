"use client";

import { useEffect, useRef } from "react";
import { minutesToMs } from "./clock";
import { useChime } from "./use-chime";
import { useNow } from "./use-now";
import { useServerOffset } from "./use-server-offset";

/** A slot is one talk followed by its feedback; each gets its own countdown. */
export type TimerPhase = "presentation" | "feedback";

/**
 * The clock as the session row describes it. Every device gets the same four
 * figures — the laptop on the projector, the phone in the organiser's hand, and
 * the attendees' phones — which is what keeps them all showing the same time.
 */
export interface SharedClock {
  /** Back-dated start instant; absent means paused. See `convex/schema.ts`. */
  clockStartedAt?: number;
  /** Elapsed ms banked by the last pause. */
  clockElapsedMs?: number;
  bonusPresentationMs?: number;
  bonusFeedbackMs?: number;
}

export interface PresenterTimer {
  phase: TimerPhase;
  /** Counts past zero, so an overrunning talk shows how far over it has gone. */
  secondsLeft: number;
  running: boolean;
  /** True once the feedback window has elapsed — the slot is over. */
  overrun: boolean;
  /** Length of the window currently on screen, including any granted minutes. */
  phaseSeconds: number;
  ensureAudio: () => void;
}

/**
 * One slot's clock, read off the session rather than kept in this browser, and
 * derived from a single elapsed figure rather than accumulated a tick at a time.
 *
 * Ticking would drift, and — worse for a projected clock — browsers throttle
 * timers hard in a background tab, so the room would silently be given extra
 * minutes. Here the interval only decides *when* to re-read `Date.now()`; a
 * throttled tab, or a phone that was asleep, shows the right time the moment it
 * comes back. The phase boundary is derived from the same figure, so the clock
 * and the phase can never disagree.
 *
 * The instants on the session are the server's, so each device reads them on
 * server time too (`useServerOffset`): a phone whose clock runs a few seconds
 * fast still shows the same figure as the projector.
 */
export function usePresenterTimer(
  presentationMinutes: number,
  feedbackMinutes: number,
  clock: SharedClock,
): PresenterTimer {
  const { clockStartedAt, clockElapsedMs } = clock;
  const running = clockStartedAt !== undefined;

  const presentationEndMs = minutesToMs(presentationMinutes) + (clock.bonusPresentationMs ?? 0);
  const slotEndMs =
    presentationEndMs + minutesToMs(feedbackMinutes) + (clock.bonusFeedbackMs ?? 0);

  // What the last tick read off the wall clock. Only ticks while running; a
  // paused clock reads the figure the pause banked instead.
  const now = useNow(running) + useServerOffset();

  const elapsedMs = running ? Math.max(0, now - clockStartedAt) : (clockElapsedMs ?? 0);

  const phase: TimerPhase = elapsedMs < presentationEndMs ? "presentation" : "feedback";

  const { ensureAudio, chime } = useChime();
  // Each chime belongs to one crossing of its mark, not to every tick past it.
  // `null` until the first reading: a device that opens mid-talk, or an admin
  // who grants another minute and then runs out of it again, must not replay a
  // chime the room has already heard — but a mark that moves back in front of
  // the clock (another minute granted, or a reset) is armed again.
  const handoverChimedRef = useRef<boolean | null>(null);
  const endChimedRef = useRef<boolean | null>(null);

  // One tone hands over to feedback, three lower ones end the slot, so the room
  // can tell them apart without looking up.
  useEffect(() => {
    const pastHandover = elapsedMs >= presentationEndMs;
    const pastEnd = elapsedMs >= slotEndMs;
    const first = handoverChimedRef.current === null;

    if (!first && pastHandover && !handoverChimedRef.current) chime(1, 880);
    if (!first && pastEnd && !endChimedRef.current) chime(3, 660);

    handoverChimedRef.current = pastHandover;
    endChimedRef.current = pastEnd;
  }, [elapsedMs, presentationEndMs, slotEndMs, chime]);

  const phaseEndMs = phase === "presentation" ? presentationEndMs : slotEndMs;

  return {
    phase,
    secondsLeft: Math.ceil((phaseEndMs - elapsedMs) / 1000),
    running,
    overrun: elapsedMs >= slotEndMs,
    phaseSeconds: Math.round(
      (phase === "presentation" ? presentationEndMs : slotEndMs - presentationEndMs) / 1000,
    ),
    ensureAudio,
  };
}
