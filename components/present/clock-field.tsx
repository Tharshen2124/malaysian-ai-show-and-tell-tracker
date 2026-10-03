"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  MAX_SLOT_SECONDS,
  MIN_SLOT_SECONDS,
  clampSlotSeconds,
  clockDigits,
  clockDigitsToSeconds,
  formatClock,
  formatClockDigits,
} from "@/lib/clock";
import { Button } from "@/components/ui/button";

/** How much the − and + buttons move the clock. */
const STEP_SECONDS = 30;

interface ClockFieldProps {
  label: string;
  /** The saved length of this window. */
  seconds: number;
  onCommit: (seconds: number) => void;
}

/**
 * A slot length, typed into something that looks like the clock it sets — see
 * `clockDigits` for how the digits fill.
 *
 * Committed on blur, or on Enter, rather than per keystroke: half a time (the
 * "3" of 03:00, which reads as 00:03) must never reach the server.
 */
export function ClockField({ label, seconds, onCommit }: ClockFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Non-null only while being typed into; otherwise the saved value shows,
  // including a change made on another admin's device.
  const [draft, setDraft] = useState<string | null>(null);

  // Digits fill from the right, so the caret has to stay at the right. Without
  // this it lands mid-string after the reformat and the next digit goes in the
  // middle, where it would be read as part of the minutes.
  useEffect(() => {
    const el = inputRef.current;
    if (draft === null || !el || document.activeElement !== el) return;
    el.setSelectionRange(el.value.length, el.value.length);
  }, [draft]);

  const commit = () => {
    if (draft === null) return;
    const typed = clockDigitsToSeconds(draft);
    setDraft(null);
    // An empty box, or 00:00, means they changed their mind rather than that
    // they want a zero-second talk: put the saved value back.
    if (typed < MIN_SLOT_SECONDS || typed > MAX_SLOT_SECONDS) return;
    if (typed !== seconds) onCommit(typed);
  };

  const step = (by: number) => {
    setDraft(null);
    const next = clampSlotSeconds(seconds + by);
    if (next !== seconds) onCommit(next);
  };

  return (
    <div className="flex-1 rounded-lg border border-border bg-background px-3 py-3 text-center">
      <label className="block text-xs font-medium text-muted-foreground" htmlFor={`clock-${label}`}>
        {label}
      </label>
      <input
        id={`clock-${label}`}
        ref={inputRef}
        // Not type="number": this is mm:ss, and the spinner would fight the
        // steppers below. inputMode still brings up a phone's number pad.
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft === null ? formatClock(seconds) : formatClockDigits(draft)}
        onChange={(e) => setDraft(clockDigits(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") setDraft(null);
        }}
        aria-label={`${label} length, minutes and seconds`}
        className="display-figure mt-1 w-full bg-transparent text-center text-[clamp(2.25rem,7vw,3rem)] leading-none text-foreground outline-none focus-visible:text-primary"
      />
      <div className="mt-2 flex items-center justify-center gap-2">
        <Button
          onClick={() => step(-STEP_SECONDS)}
          disabled={seconds <= MIN_SLOT_SECONDS}
          variant="outline"
          size="icon-sm"
          aria-label={`Take 30 seconds off the ${label.toLowerCase()}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">30s</span>
        <Button
          onClick={() => step(STEP_SECONDS)}
          disabled={seconds >= MAX_SLOT_SECONDS}
          variant="outline"
          size="icon-sm"
          aria-label={`Add 30 seconds to the ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
