"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Round trips per measurement; the quickest one is the most trustworthy. */
const SAMPLES = 3;
/** A phone that slept may have corrected its clock since, so coming back to
 *  the page measures again — but not on every flick between apps. */
const RESYNC_AFTER_MS = 60_000;

/**
 * How far this device's wall clock is behind the server's, in ms.
 *
 * Every instant on the session's clock is stamped by the server, and each
 * device works out the elapsed figure against its own `Date.now()`. A phone
 * running five seconds fast would show five seconds less than the projector,
 * so every device measures the gap once and reads the clock on server time.
 *
 * Module-level, like `useNow`'s reading: one measurement serves the whole page,
 * including the presenter timer that remounts for every new person on stage.
 */
let offsetMs = 0;
let measuredAt: number | null = null;
let measuring = false;
const listeners = new Set<() => void>();

/** `Date.now()`, corrected to the server's clock. For stamping a clock instant
 *  on this device — an optimistic update — in the same terms the server does. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

const readOffset = () => offsetMs;
const noOffset = () => 0;

/**
 * The offset to add to `Date.now()` to get the server's time. Starts at zero —
 * this device's own clock, which is usually close — and settles once the first
 * measurement is back, a few hundred ms after the page opens.
 */
export function useServerOffset(): number {
  const serverTime = useMutation(api.present.serverTime);

  useEffect(() => {
    const measure = async () => {
      if (measuring) return;
      if (measuredAt !== null && Date.now() - measuredAt < RESYNC_AFTER_MS) return;
      measuring = true;
      try {
        // The server reads its clock somewhere between sending and receiving;
        // assuming the middle is out by at most half the round trip, so the
        // shortest of a few trips gives the tightest answer.
        let best: { roundTrip: number; offset: number } | null = null;
        for (let i = 0; i < SAMPLES; i++) {
          const sentAt = Date.now();
          const server = await serverTime();
          const receivedAt = Date.now();
          const roundTrip = receivedAt - sentAt;
          if (!best || roundTrip < best.roundTrip) {
            best = { roundTrip, offset: server - (sentAt + receivedAt) / 2 };
          }
        }
        if (best) {
          offsetMs = Math.round(best.offset);
          measuredAt = Date.now();
          listeners.forEach((notify) => notify());
        }
      } catch {
        // Unreachable: keep whatever offset we had. The clock still runs, on
        // this device's own time.
      } finally {
        measuring = false;
      }
    };

    void measure();
    const onVisible = () => {
      if (document.visibilityState === "visible") void measure();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [serverTime]);

  return useSyncExternalStore(subscribe, readOffset, noOffset);
}
