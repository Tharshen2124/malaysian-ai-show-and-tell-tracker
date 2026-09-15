"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, MapPin, Timer } from "lucide-react";
import { useAccess } from "@/lib/use-access";
import { Attribution } from "@/components/ui/attribution";
import { Wordmark } from "@/components/ui/wordmark";
import { buttonClass } from "@/components/ui/button";

/** The org's Luma calendar, not a single event — each week gets its own listing. */
const LUMA_CALENDAR_URL = "https://luma.com/malaysianai";
const MALAYSIAN_AI_URL = "https://www.malaysian.ai/";

/** The standing shape of the meetup this tracker records. */
const EVENT_DETAILS = [
  { Icon: CalendarDays, text: "Thursdays, 5–6PM" },
  { Icon: MapPin, text: "500 Global Office, AICB, KL" },
  { Icon: Timer, text: "4 min demo + 2 min feedback" },
];

/** Chapter gutters, fluid like design.md's section padding. */
const GUTTER = "px-[clamp(1.25rem,4vw,4rem)]";

export default function LandingPage() {
  const router = useRouter();
  const { hasAccess } = useAccess();

  useEffect(() => {
    if (hasAccess) router.replace("/dashboard");
  }, [hasAccess, router]);

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className={`flex items-center justify-between gap-4 pt-6 ${GUTTER}`}>
        <Wordmark />
        <a
          href={MALAYSIAN_AI_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[0.82rem] text-muted underline-offset-[0.3rem] transition-colors hover:text-ink hover:underline"
        >
          Malaysian AI ↗
        </a>
      </header>

      {/* Typographic hero: one kicker, one very large serif line, one lede, one CTA row. */}
      <main className={`flex flex-1 flex-col justify-center py-[clamp(4rem,7vw,6rem)] ${GUTTER}`}>
        <div className="mx-auto w-full max-w-[92rem]">
          <p className="kicker animate-soft-rise [animation-delay:50ms]">
            The Weekly Show &amp; Tell · Malaysian AI Residency
          </p>
          <h1 className="mt-5 max-w-[64rem] animate-soft-rise text-[clamp(2.9rem,7.2vw,6.5rem)] leading-[0.88] tracking-[-0.045em] [animation-delay:0.35s]">
            The running record of what Malaysian AI builders are building.
          </h1>
          <p className="mt-7 max-w-[36rem] animate-soft-rise text-[clamp(0.92rem,1.25vw,1.08rem)] text-soft [animation-delay:0.55s]">
            Every project shown at the Weekly Show &amp; Tell, and the progress that followed.
          </p>

          <ul className="mt-8 flex animate-soft-rise flex-col gap-2.5 text-[0.86rem] text-muted [animation-delay:0.7s] sm:flex-row sm:gap-6">
            {EVENT_DETAILS.map(({ Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex animate-soft-rise flex-wrap items-center gap-3 [animation-delay:0.85s]">
            <Link href="/login" className={buttonClass("primary", { lift: true })}>
              Login
            </Link>
            <a
              href={LUMA_CALENDAR_URL}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonClass("ghost")}
            >
              See upcoming events
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>

      <footer className={`bg-site py-[clamp(2.5rem,5vw,4rem)] ${GUTTER}`}>
        <div className="mx-auto w-full max-w-[92rem]">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-t-[1.5px] border-hairline pt-5 text-[0.76rem] text-muted">
            <p className="max-w-[40rem]">
              The tracker for the Weekly Show &amp; Tell at the{" "}
              <a
                href={MALAYSIAN_AI_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-2 transition-colors hover:text-ink"
              >
                Malaysian AI
              </a>{" "}
              Residency. Private to members. Ask an organiser for access.
            </p>
            <p>
              <Attribution />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
