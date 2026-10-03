"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Hourglass, Mic, Sparkles } from "lucide-react";
import { useChime } from "@/lib/use-chime";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AttendeeClock, SlotClock } from "./attendee-clock";
import { AlertKind, PlaceAlert } from "./place-alert";

export type PlaceState = "waiting" | "next" | "presenting" | "done";

export interface RosterEntry {
  name: string;
  /** 1-based, matching the numbers on the screen at the front of the room. */
  number: number;
  isYou: boolean;
}

export interface Place {
  name: string;
  /** 1-based, as it reads on the screen at the front of the room. */
  position: number;
  total: number;
  state: PlaceState;
  /** Whose turn it is, 1-based, or null when nobody is on stage yet. */
  currentNumber: number | null;
  /** The whole running order, so they can see how far off their turn is. */
  roster: RosterEntry[];
  /** The session's own state: once it is "done", so is everyone on the list. */
  status: "collecting" | "locked" | "done";
  /** The clock on whoever is up, or null when nobody is on stage. */
  clock: SlotClock | null;
}

/** Two rising tones for "you're next", three for "you're up". */
const ALERTS: Partial<Record<PlaceState, { beeps: number; frequency: number }>> = {
  next: { beeps: 2, frequency: 880 },
  presenting: { beeps: 3, frequency: 1046 },
};

const VIBRATE: Partial<Record<PlaceState, number[]>> = {
  next: [200, 100, 200],
  presenting: [400, 120, 400, 120, 400],
};

/** Long enough to be read from across the room, short enough that it gives the
 *  running order back before the talk it announced is over. */
const ALERT_MS = 12_000;

export function AttendeePlace({ place }: { place: Place }) {
  const { chime } = useChime();
  const [alert, setAlert] = useState<AlertKind | null>(null);
  // Alerts fire on the transition into a state, not on every re-render the
  // subscription causes.
  const alertedRef = useRef<PlaceState | null>(null);

  useEffect(() => {
    if (alertedRef.current === place.state) return;
    const first = alertedRef.current === null;
    alertedRef.current = place.state;
    // Nothing should go off just because the page was opened mid-session.
    if (first) return;

    const sound = ALERTS[place.state];
    if (sound) chime(sound.beeps, sound.frequency);
    const pattern = VIBRATE[place.state];
    // Android honours this; iOS Safari has no vibration API, hence the chime.
    if (pattern && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
    // Moving on to "done" or back to "waiting" also clears a popup they never
    // got round to dismissing.
    setAlert(place.state === "next" || place.state === "presenting" ? place.state : null);
  }, [place.state, chime]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), ALERT_MS);
    return () => clearTimeout(timer);
  }, [alert]);

  const presenter = place.currentNumber !== null ? place.roster[place.currentNumber - 1] : null;

  return (
    <div className="grid gap-4">
      <StatusCard place={place} />

      {place.clock && presenter && (
        <AttendeeClock
          clock={place.clock}
          presenterName={presenter.name}
          isYou={place.state === "presenting"}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <NumberTile label="Current presenter" value={place.currentNumber} />
        <NumberTile label="Your number" value={place.position} />
      </div>

      <RunningOrder place={place} />

      <PlaceAlert kind={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

/** platform-design.md's eyebrow: sentence case, 600, muted — not the marketing kicker. */
const EYEBROW = "text-[0.8125rem] leading-snug font-semibold text-muted-foreground";

/** Big numbers, in the body face so the digits stay tabular. */
const FIGURE = "font-bold tracking-[-0.02em] tabular-nums";

/** The two figures from the front of the room, kept legible at arm's length. */
function NumberTile({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="items-center justify-center gap-2 px-3 py-5 text-center">
      <p className={EYEBROW}>{label}</p>
      <p className={cn(FIGURE, "text-[clamp(2.75rem,15vw,3.75rem)] leading-none")}>
        {/* Padded so the two tiles stay the same width as the order moves on. */}
        {value === null ? "—" : String(value).padStart(2, "0")}
      </p>
    </Card>
  );
}

function RunningOrder({ place }: { place: Place }) {
  const { roster, currentNumber, status } = place;
  // A finished session strikes the whole list through, including anyone whose
  // turn never came around.
  const finished = status === "done";

  return (
    <Card className="gap-3 px-2.5 py-4">
      <h2 className="flex items-baseline gap-2 px-2.5 text-[1.0625rem]">
        The order
        <span className="text-[0.8125rem] font-normal text-muted-foreground tabular-nums">
          {roster.length} {roster.length === 1 ? "person" : "people"}
        </span>
      </h2>
      <ol className="grid gap-0.5">
        {roster.map((row) => {
          const now = !finished && row.number === currentNumber;
          const done = finished || (currentNumber !== null && row.number < currentNumber);
          return (
            <li
              key={row.number}
              aria-current={now ? "true" : undefined}
              className={cn(
                "flex gap-3 rounded-lg px-2.5 py-2 text-[0.9375rem]",
                // Their own row wears the sidebar's selection pill.
                row.isYou && "bg-selection",
                now
                  ? "font-semibold text-success"
                  : done
                    ? "text-muted-foreground/70"
                    : "text-foreground",
              )}
            >
              <span className="w-6 shrink-0 text-muted-foreground/70 tabular-nums">
                {row.number}.
              </span>
              {/* One flow rather than separate columns, so the label sits beside
                  the name and wraps with it instead of hugging the right edge. */}
              <span className="min-w-0 flex-1 break-words">
                <span className={cn(done && "line-through", row.isYou && "font-semibold")}>
                  {row.name}
                </span>
                {now && <span className="ml-2 text-xs font-normal">(presenting now)</span>}
                {!now && row.isYou && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** Where they stand, in the one line that matters right now. The numbers are
 *  left to the tiles below, so this says what to *do*. */
function StatusCard({ place }: { place: Place }) {
  if (place.state === "presenting") {
    return (
      <StatusPanel tone="accent" icon={<Mic className="size-9" />} title="You're presenting now!">
        <p className="text-sm">You&apos;re on — go for it, {place.name}.</p>
      </StatusPanel>
    );
  }

  if (place.state === "next") {
    return (
      <StatusPanel tone="warn" icon={<Sparkles className="size-9" />} title="You're up next!" pulse>
        <p className="text-sm">Head to the front when the current talk wraps up.</p>
      </StatusPanel>
    );
  }

  // Also the state once the whole session is wrapped up, so the wording has to
  // suit someone whose turn never came around.
  if (place.state === "done") {
    return (
      <StatusPanel tone="done" icon={<CheckCircle2 className="size-9" />} title="You're all done">
        <p className="text-sm">Thanks, {place.name}. Enjoy the rest of the talks.</p>
      </StatusPanel>
    );
  }

  const ahead = place.position - 1;
  return (
    <StatusPanel
      tone="calm"
      icon={<Hourglass className="size-8 text-primary" />}
      title={`You're number ${place.position}`}
    >
      <p className="text-sm text-muted-foreground">
        {ahead === 0
          ? `You're first up, ${place.name}.`
          : `${ahead} ${ahead === 1 ? "person is" : "people are"} ahead of you.`}{" "}
        Keep this page open and it&apos;ll tell you when you&apos;re next.
      </p>
    </StatusPanel>
  );
}

/** platform-design.md's status pairs: a saturated text colour on its own soft fill. */
const TONES = {
  calm: "border-border bg-card text-foreground shadow-card",
  warn: "border-warn-line bg-warn-soft text-warn",
  accent: "border-success-line bg-success-soft text-success",
  done: "border-border bg-card text-muted-foreground shadow-card",
};

function StatusPanel({
  tone,
  icon,
  title,
  pulse,
  children,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border px-6 py-8 text-center",
        TONES[tone],
        pulse && "animate-pulse",
      )}
    >
      {icon}
      <p className="text-[1.75rem] leading-tight font-bold tracking-[-0.028em] text-balance">
        {title}
      </p>
      {children}
    </div>
  );
}
