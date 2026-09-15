"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChime } from "./use-chime";

/** A slot is one talk followed by its feedback; each gets its own countdown. */
export type TimerPhase = "presentation" | "feedback";

const TICK_MS = 250;
const MINUTE_MS = 60_000;

export function formatClock(totalSeconds: number): string {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const mm = String(Math.floor(abs / 60)).padStart(2, "0");
  const ss = String(abs % 60).padStart(2, "0");
  return `${negative ? "-" : ""}${mm}:${ss}`;
}

export interface PresenterTimer {
  phase: TimerPhase;
  /** Counts past zero, so an overrunning talk shows how far over it has gone. */
  secondsLeft: number;
  running: boolean;
  /** True once the feedback window has elapsed — the slot is over. */
  overrun: boolean;
  toggle: () => void;
  reset: () => void;
  addMinute: () => void;
  /** Skip straight to feedback without waiting out the presentation clock. */
  skipToFeedback: () => void;
  ensureAudio: () => void;
}

/**
 * One slot's clock, as a single elapsed figure read off the wall clock rather
 * than accumulated a tick at a time. Ticking would drift, and — worse for a
 * projected clock — browsers throttle timers hard in a background tab, so the
 * room would silently be given extra minutes. Here the interval only decides
 * *when* to re-read `Date.now()`; a throttled tab shows the right time the
 * moment it is foregrounded again.
 *
 * The phase boundary is derived from that one figure, so the clock and the
 * phase can never disagree.
 */
export function usePresenterTimer(
  presentationMinutes: number,
  feedbackMinutes: number,
): PresenterTimer {
  const presentationMs = Math.round(presentationMinutes * MINUTE_MS);
  const feedbackMs = Math.round(feedbackMinutes * MINUTE_MS);

  // Wall-clock instant the running slot is measured from; null while paused.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // Where the clock was left when it was last paused.
  const [pausedElapsedMs, setPausedElapsedMs] = useState(0);
  // What the last tick read. Render uses only this, never Date.now().
  const [elapsedMs, setElapsedMs] = useState(0);
  // "+1 minute" lengthens whichever window is on screen.
  const [bonusPresentationMs, setBonusPresentationMs] = useState(0);
  const [bonusFeedbackMs, setBonusFeedbackMs] = useState(0);

  const presentationEndMs = presentationMs + bonusPresentationMs;
  const slotEndMs = presentationEndMs + feedbackMs + bonusFeedbackMs;
  const phase: TimerPhase = elapsedMs < presentationEndMs ? "presentation" : "feedback";
  const running = startedAt !== null;

  const { ensureAudio, chime } = useChime();
  // Each chime belongs to one crossing, not to every tick past it.
  const handoverChimedRef = useRef(false);
  const endChimedRef = useRef(false);

  // The tick: re-read the wall clock, and sound the two marks as they pass.
  // One tone hands over to feedback, three lower ones end the slot, so the room
  // can tell them apart without looking up.
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= presentationEndMs && !handoverChimedRef.current) {
        handoverChimedRef.current = true;
        chime(1, 880);
      }
      if (elapsed >= slotEndMs && !endChimedRef.current) {
        endChimedRef.current = true;
        chime(3, 660);
      }
      setElapsedMs(elapsed);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, presentationEndMs, slotEndMs, chime]);

  const toggle = useCallback(() => {
    ensureAudio();
    if (startedAt !== null) {
      const elapsed = Date.now() - startedAt;
      setPausedElapsedMs(elapsed);
      setElapsedMs(elapsed);
      setStartedAt(null);
    } else {
      setStartedAt(Date.now() - pausedElapsedMs);
    }
  }, [startedAt, pausedElapsedMs, ensureAudio]);

  const reset = useCallback(() => {
    handoverChimedRef.current = false;
    endChimedRef.current = false;
    setStartedAt(null);
    setPausedElapsedMs(0);
    setElapsedMs(0);
    setBonusPresentationMs(0);
    setBonusFeedbackMs(0);
  }, []);

  const addMinute = useCallback(() => {
    if (phase === "presentation") {
      setBonusPresentationMs((ms) => ms + MINUTE_MS);
    } else {
      // Granting more feedback time re-arms the end chime for the new mark.
      endChimedRef.current = false;
      setBonusFeedbackMs((ms) => ms + MINUTE_MS);
    }
  }, [phase]);

  const skipToFeedback = useCallback(() => {
    if (phase !== "presentation") return;
    ensureAudio();
    // The admin moved things on deliberately — no need to chime at them.
    handoverChimedRef.current = true;
    if (startedAt !== null) setStartedAt(Date.now() - presentationEndMs);
    else setPausedElapsedMs(presentationEndMs);
    setElapsedMs(presentationEndMs);
  }, [phase, startedAt, presentationEndMs, ensureAudio]);

  const remainingMs = (phase === "presentation" ? presentationEndMs : slotEndMs) - elapsedMs;

  return {
    phase,
    secondsLeft: Math.ceil(remainingMs / 1000),
    running,
    overrun: elapsedMs >= slotEndMs,
    toggle,
    reset,
    addMinute,
    skipToFeedback,
    ensureAudio,
  };
}
