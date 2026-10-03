import { describe, expect, it } from "vitest";
import {
  clampSlotSeconds,
  clockDigits,
  clockDigitsToSeconds,
  formatClock,
  formatClockDigits,
  minutesToSeconds,
  secondsToMinutes,
} from "../lib/clock";

describe("formatClock", () => {
  it("pads both halves, so a projected clock does not change width", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(9)).toBe("00:09");
    expect(formatClock(180)).toBe("03:00");
    expect(formatClock(3661)).toBe("61:01");
  });

  it("signs an overrun rather than wrapping back round", () => {
    expect(formatClock(-1)).toBe("-00:01");
    expect(formatClock(-95)).toBe("-01:35");
  });
});

describe("slot lengths on the wire", () => {
  it("survives the round trip through minutes, seconds and all", () => {
    for (const seconds of [5, 10, 90, 180, 185, 7200]) {
      expect(minutesToSeconds(secondsToMinutes(seconds))).toBe(seconds);
    }
  });

  it("clamps a typo to something a slot could actually be", () => {
    expect(clampSlotSeconds(0)).toBe(5);
    expect(clampSlotSeconds(-30)).toBe(5);
    expect(clampSlotSeconds(200)).toBe(200);
    expect(clampSlotSeconds(99_999)).toBe(7200);
  });
});

describe("typing a duration into a clock-shaped box", () => {
  /** Replays a run of keystrokes against the box, as the component does. */
  function type(keys: string): string {
    let digits = "";
    for (const key of keys) {
      // A digit lands at the end of what is on screen; a backspace takes the
      // last character of it away.
      const onScreen = formatClockDigits(digits);
      digits = clockDigits(key === "<" ? onScreen.slice(0, -1) : onScreen + key);
    }
    return formatClockDigits(digits);
  }

  it("fills from the right, so three minutes is 3 then 0 then 0", () => {
    expect(type("3")).toBe("00:03");
    expect(type("30")).toBe("00:30");
    expect(type("300")).toBe("03:00");
    expect(type("1230")).toBe("12:30");
  });

  it("drops the oldest digit once four are in, rather than refusing the fifth", () => {
    expect(type("12345")).toBe("23:45");
  });

  it("shifts back to the right on a backspace", () => {
    expect(type("300<")).toBe("00:30");
    expect(type("300<<")).toBe("00:03");
    expect(type("300<<<")).toBe("00:00");
  });

  it("reads the box as minutes and seconds", () => {
    expect(clockDigitsToSeconds(clockDigits("03:00"))).toBe(180);
    expect(clockDigitsToSeconds(clockDigits("01:30"))).toBe(90);
    expect(clockDigitsToSeconds(clockDigits("5"))).toBe(5);
    expect(clockDigitsToSeconds(clockDigits(""))).toBe(0);
  });

  it("ignores anything that is not a digit, including the colon it prints", () => {
    expect(clockDigits("1a2:b3")).toBe("123");
    expect(clockDigits("-12")).toBe("12");
  });
});
