/**
 * Credit to the community this app descends from. Sets no colour of its own, so
 * it inherits whatever footer it sits in; the link is marked by its underline.
 */
export function Attribution() {
  return (
    <span>
      This tracker is adapted with permission from the system in use at{" "}
      <a
        href="https://hackerspacemmu.rocks/"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2 transition-colors hover:text-ink"
      >
        Hackerspace MMU
      </a>
      .
    </span>
  );
}
