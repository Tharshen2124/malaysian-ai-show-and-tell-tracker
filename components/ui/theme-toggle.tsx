"use client";

import { ThemePreference, useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * The System / Light / Dark segmented control. The three-way contract is the
 * theme system — `data-theme` absent means "follow the OS", which is what both
 * the light-dark() tokens and the shadcn dark blocks key off. Restyled only.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div role="group" aria-label="Colour theme" className={cn("inline-flex gap-0.5 rounded-[9px] bg-muted p-0.5", className)}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
          className="min-h-7 flex-1 rounded-[7px] px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-[0_1px_3px_#0000001f] max-sm:min-h-11"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
