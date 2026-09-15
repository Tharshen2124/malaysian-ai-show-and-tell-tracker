export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-outline"
  | "success-outline";

const VARIANTS: Record<ButtonVariant, string> = {
  // The inverted fill: near-black on cream, white on navy — always maximum contrast.
  primary: "bg-button text-on-button hover:bg-button-hover focus-visible:bg-button-hover",
  outline:
    "border-[1.5px] border-hairline bg-transparent text-ink hover:border-link-bright hover:text-link-bright",
  ghost: "bg-transparent text-soft underline underline-offset-[0.22em] hover:text-ink",
  // The one sanctioned solid state fill: the button that actually deletes.
  danger: "bg-danger text-page hover:opacity-90",
  "danger-outline": "border-[1.5px] border-danger-line bg-transparent text-danger hover:bg-danger-soft",
  "success-outline":
    "border-[1.5px] border-success-line bg-transparent text-success hover:bg-success-soft",
};

/**
 * design.md's `.site-button` with a modifier, as a class string so a `Link` can
 * wear it as easily as a `<button>`. `lift` is the `translateY(-2px)` variant.
 */
export function buttonClass(variant: ButtonVariant = "primary", { lift = false } = {}): string {
  return `site-button ${VARIANTS[variant]}${
    lift ? " hover:-translate-y-0.5 focus-visible:-translate-y-0.5" : ""
  }`;
}

/** Icon-only actions inside dense rows and headers (edit, delete, close). */
export function iconButtonClass(tone: "default" | "danger" = "default"): string {
  return `inline-flex shrink-0 items-center justify-center rounded-button p-1.5 text-faint transition-colors disabled:opacity-40 ${
    tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-recessed hover:text-ink"
  }`;
}
