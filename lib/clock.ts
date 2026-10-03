/**
 * The one way this app writes a duration: mm:ss. The room reads the running
 * clock off a projector and the admin types the slot lengths into fields that
 * look just like it, so both go through here.
 */

const MINUTE_MS = 60_000;

/** `present.assertMinutes` enforces the same ceiling server-side. */
export const MAX_SLOT_SECONDS = 120 * 60;
/** Anything shorter than this is a typo, not a slot. */
export const MIN_SLOT_SECONDS = 5;

export function clampSlotSeconds(seconds: number): number {
  return Math.min(Math.max(Math.round(seconds), MIN_SLOT_SECONDS), MAX_SLOT_SECONDS);
}

/** Signed, so an overrunning talk shows how far over it has gone. */
export function formatClock(totalSeconds: number): string {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const mm = String(Math.floor(abs / 60)).padStart(2, "0");
  const ss = String(abs % 60).padStart(2, "0");
  return `${negative ? "-" : ""}${mm}:${ss}`;
}

/**
 * Slot lengths are stored in minutes, and have been since before they could be
 * set to the second — so 90 seconds is 1.5 minutes on the wire. Both ends round
 * at the millisecond, which is well inside the precision a float gives us here.
 */
export function minutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}

export function secondsToMinutes(seconds: number): number {
  return seconds / 60;
}

export function minutesToMs(minutes: number): number {
  return Math.round(minutes * MINUTE_MS);
}

// ---------------------------------------------------------------------------
// Typing a duration into something shaped like a clock. Digits fill from the
// right the way a microwave's do: 3 then 0 then 0 gives 03:00. It is the
// fastest way in on a keyboard, and the only scheme that behaves on a phone's
// number pad, where there is no reliable caret to put a colon either side of.
// ---------------------------------------------------------------------------

/**
 * The digits a box now holds, as mm:ss can use them. Taking the last four of
 * whatever was typed is what makes both directions work: a digit added on the
 * end shifts the rest left, and a backspace shifts them back right.
 */
export function clockDigits(value: string): string {
  return value.replace(/\D/g, "").slice(-4);
}

export function formatClockDigits(digits: string): string {
  const padded = digits.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

/** Reads mm:ss, so 0130 is ninety seconds. Minutes are not carried: 0199 is
 *  1 minute 99 seconds, which `clampSlotSeconds` is left to make sense of. */
export function clockDigitsToSeconds(digits: string): number {
  const padded = digits.padStart(4, "0");
  return Number(padded.slice(0, 2)) * 60 + Number(padded.slice(2));
}
