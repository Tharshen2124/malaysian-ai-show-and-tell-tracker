export type ButtonVariant = "primary" | "outline" | "ghost";

const VARIANTS: Record<ButtonVariant, string> = {
  // The inverted fill: near-black on cream, white on navy — always maximum contrast.
  primary: "bg-button text-on-button hover:bg-button-hover focus-visible:bg-button-hover",
  outline:
    "border-[1.5px] border-hairline bg-transparent text-ink hover:border-link-bright hover:text-link-bright",
  ghost: "bg-transparent text-soft underline underline-offset-[0.22em] hover:text-ink",
};

/**
 * design.md's `.site-button` with a modifier, as a class string so a `Link` can
 * wear it as easily as a `<button>`. `lift` is the `translateY(-2px)` variant.
 *
 * This is the Malaysian AI button, and it is now only worn by the pages that
 * kept that look: the landing page, login and join. Everything under
 * app/(dashboard) uses shadcn's `Button` / `buttonVariants` instead.
 */
export function buttonClass(variant: ButtonVariant = "primary", { lift = false } = {}): string {
  return `site-button ${VARIANTS[variant]}${
    lift ? " hover:-translate-y-0.5 focus-visible:-translate-y-0.5" : ""
  }`;
}
