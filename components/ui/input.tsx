import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Vendored from the shadcn registry, with one deliberate local change: the
 * `max-sm:` height bumps. This app is used on phones at live meetups and the
 * design system it replaces guaranteed 44px touch targets below 43.75rem;
 * shadcn's h-9/size-8 are 36px/32px. Do not re-add with `shadcn add --overwrite`.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 max-sm:min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-1 text-base transition-[color,border-color,box-shadow] outline-none hover:border-border-hover selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/75 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
        // platform-design.md's focus: the accent border plus a 4px ring at ~18%.
        "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
