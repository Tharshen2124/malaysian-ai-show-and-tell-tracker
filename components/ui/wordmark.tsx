/**
 * The Show&Tell wordmark — the one element design.md allows the Mondwest pixel
 * face ("use the pixel font once"). Reused wherever the brand sits, but nothing
 * else in the app is ever set in it.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-pixel text-[clamp(1.35rem,1.8vw,1.7rem)] leading-none ${className}`}>
      Show<span className="text-accent">&amp;</span>Tell
    </span>
  );
}
