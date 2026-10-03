import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

/*
 * Vendored from the shadcn registry, with one deliberate local change: the
 * `max-sm:` height bumps. This app is used on phones at live meetups and the
 * design system it replaces guaranteed 44px touch targets below 43.75rem;
 * shadcn's h-9/size-8 are 36px/32px. Do not re-add with `shadcn add --overwrite`.
 *
 * Restyled to platform-design.md: 10px radius, 500 weight, hover lightens the
 * fill rather than fading it, and a press settles to 97%.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-[0.9375rem] font-medium tracking-[-0.005em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none active:not-disabled:scale-[0.97] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        // The field surface, so dropdown triggers built on it read as inputs.
        outline: "border border-input bg-card hover:border-border-hover hover:bg-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "text-muted-foreground hover:bg-hover hover:text-foreground",
        link: "text-primary underline-offset-[3px] hover:underline",
      },
      size: {
        default: "h-10 px-[1.125rem] py-2 has-[>svg]:px-3.5 max-sm:min-h-11",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[2.125rem] gap-1.5 px-3.5 text-[0.8125rem] has-[>svg]:px-3 max-sm:min-h-11",
        lg: "h-[2.625rem] px-6 has-[>svg]:px-4 max-sm:min-h-11",
        icon: "size-10 max-sm:size-11",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 max-sm:size-11",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
