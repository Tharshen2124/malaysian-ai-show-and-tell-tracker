"use client";

import { useSyncExternalStore } from "react";

/** How often a running clock re-reads the wall clock. */
const TICK_MS = 250;

/**
 * The wall clock, as something React can subscribe to.
 *
 * One interval is shared by every subscriber, and the reading is a plain
 * module-level number rather than component state, which is what lets the
 * value be read during render without reaching for `Date.now()` there. The
 * reading is refreshed the moment a subscriber arrives, so a clock that
 * resumes shows the right figure on that render rather than up to a tick later.
 */
const listeners = new Set<() => void>();
let reading = Date.now();
let interval: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (interval === null) {
    reading = Date.now();
    interval = setInterval(() => {
      reading = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  } else {
    reading = Date.now();
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };
}

const readTime = () => reading;
const neverChanges = () => () => {};

/**
 * The current time, re-read four times a second while `active`. Paused clocks
 * pass `false` and stop costing anything — and stop waking a phone's CPU.
 */
export function useNow(active: boolean): number {
  return useSyncExternalStore(active ? subscribe : neverChanges, readTime, readTime);
}
