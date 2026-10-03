import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base leading-relaxed transition-[color,border-color,box-shadow] outline-none hover:border-border-hover placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
