"use client";

import { ReactNode } from "react";

/**
 * Wrapping <label> rather than shadcn's <Label htmlFor>, so the control stays
 * implicitly associated without every call site inventing an id — and so a
 * nested <Label> never produces a label-inside-label.
 */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[0.86rem] leading-none font-medium">{label}</span>
      {children}
    </label>
  );
}

/**
 * A native <select> wearing shadcn's Input surface. Deliberately not Radix
 * Select: the forms only need a plain picker, and the native control keeps
 * mobile's system wheel.
 */
export const nativeSelectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-1 text-base transition-[color,border-color,box-shadow] outline-none hover:border-border-hover focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm max-sm:min-h-11";

/** platform-design.md's segmented tabs: a tint track, the choice lifted onto paper. */
export function RadioRow<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-[9px] bg-muted p-0.5">
      {options.map((option) => (
        <label
          key={option.value}
          className={`cursor-pointer rounded-[7px] px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring max-sm:py-2.5 ${
            value === option.value
              ? "bg-card text-foreground shadow-[0_1px_3px_#0000001f]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
