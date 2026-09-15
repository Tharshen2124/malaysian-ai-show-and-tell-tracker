"use client";

import { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "field-input";

/** A segmented control. The choice takes the inverted button fill so it reads on any surface. */
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
    <div className="inline-flex flex-wrap rounded-button border border-hairline p-[0.12rem]">
      {options.map((option) => (
        <label
          key={option.value}
          className={`cursor-pointer rounded-[calc(var(--radius-button)-0.08rem)] px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus max-sm:py-2.5 ${
            value === option.value ? "bg-button text-on-button" : "text-muted hover:text-ink"
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
