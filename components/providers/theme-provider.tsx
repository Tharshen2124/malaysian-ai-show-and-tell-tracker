"use client";

import { createContext, ReactNode, useCallback, useContext, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, ThemePreference } from "@/lib/theme";

export type { ThemePreference };

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// The attribute is the single source of truth: the head script stamps it, and
// reading it back through useSyncExternalStore (rather than seeding state from
// it) keeps the server render and the first client render in step.
function readPreference(): ThemePreference {
  const stamped = document.documentElement.dataset.theme;
  return stamped === "light" || stamped === "dark" ? stamped : "system";
}

const serverPreference = (): ThemePreference => "system";

const ThemeContext = createContext<{
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}>({
  preference: "system",
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(subscribe, readPreference, serverPreference);

  const setPreference = useCallback((next: ThemePreference) => {
    const root = document.documentElement;
    if (next === "system") delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
    listeners.forEach((notify) => notify());
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
