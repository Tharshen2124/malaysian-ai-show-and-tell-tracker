"use client";

import { useEffect } from "react";

/**
 * Holds a screen wake lock while `active`. A projector that sleeps part-way
 * through a talk is the obvious failure of a page whose whole job is to show a
 * clock for an hour. Unsupported browsers (and a denied request) are a no-op.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request("screen");
        // The effect may have torn down while the request was in flight.
        if (released) void next.release();
        else sentinel = next;
      } catch {
        // Denied or unavailable — the clock still works, the screen may dim.
      }
    };

    // The lock is dropped whenever the tab is hidden, so it has to be retaken.
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release();
    };
  }, [active]);
}
