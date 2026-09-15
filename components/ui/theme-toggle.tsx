"use client";

import { ThemePreference, useTheme } from "@/components/providers/theme-provider";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** design.md's segmented System / Light / Dark control. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex rounded-button border border-hairline-soft p-[0.12rem]"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
          className="min-h-[1.7rem] rounded-[calc(var(--radius-button)-0.08rem)] px-2.5 text-[0.72rem] leading-[1.2] tracking-[0.02em] text-muted transition-colors hover:text-ink aria-pressed:bg-card aria-pressed:text-ink max-sm:min-h-11"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
