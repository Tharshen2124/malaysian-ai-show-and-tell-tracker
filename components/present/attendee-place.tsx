"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Hourglass, Mic, Sparkles } from "lucide-react";
import { useChime } from "@/lib/use-chime";
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

  return (
    <div className="space-y-5">
      <StatusCard place={place} />

      <div className="grid grid-cols-2 gap-3">
        <NumberTile label="Current presenter" value={place.currentNumber} />
        <NumberTile label="Your number" value={place.position} />
      </div>

      <RunningOrder place={place} />

      <PlaceAlert kind={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

/** The two figures from the front of the room, kept legible at arm's length. */
function NumberTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="card-surface flex flex-col items-center justify-center gap-2 px-3 py-5 text-center">
      <p className="kicker">{label}</p>
      <p className="display-figure text-[clamp(2.75rem,15vw,3.75rem)] leading-none text-heading">
        {/* Padded so the two tiles stay the same width as the order moves on. */}
        {value === null ? "—" : String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function RunningOrder({ place }: { place: Place }) {
  const { roster, currentNumber, status } = place;
  // A finished session strikes the whole list through, including anyone whose
  // turn never came around.
  const finished = status === "done";

  return (
    <section className="card-surface p-4">
      <h2 className="kicker mb-3">
        The order
        <span className="ml-2 tracking-normal normal-case tabular-nums">
          ({roster.length} {roster.length === 1 ? "person" : "people"})
        </span>
      </h2>
      <ol className="space-y-2">
        {roster.map((row) => {
          const now = !finished && row.number === currentNumber;
          const done = finished || (currentNumber !== null && row.number < currentNumber);
          return (
            <li
              key={row.number}
              aria-current={now ? "true" : undefined}
              className={`flex gap-2 text-base ${
                now ? "text-success" : done ? "text-faint" : "text-ink"
              }`}
            >
              <span className="w-6 shrink-0 tabular-nums text-faint">{row.number}.</span>
              {/* One flow rather than separate columns, so the label sits beside
                  the name and wraps with it instead of hugging the right edge. */}
              <span className="min-w-0 flex-1 break-words">
                <span className={`${done ? "line-through" : ""} ${row.isYou ? "font-bold" : ""}`}>
                  {row.name}
                </span>
                {now && <span className="ml-2 text-xs">(presenting now)</span>}
                {!now && row.isYou && <span className="ml-2 text-xs text-faint">(you)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Where they stand, in the one line that matters right now. The numbers are
 *  left to the tiles below, so this says what to *do*. */
function StatusCard({ place }: { place: Place }) {
  if (place.state === "presenting") {
    return (
      <Card tone="accent" icon={<Mic className="h-9 w-9" />} title="You're presenting now!">
        <p className="text-sm">You&apos;re on — go for it, {place.name}.</p>
      </Card>
    );
  }

  if (place.state === "next") {
    return (
      <Card tone="warn" icon={<Sparkles className="h-9 w-9" />} title="You're up next!" pulse>
        <p className="text-sm">Head to the front when the current talk wraps up.</p>
      </Card>
    );
  }

  // Also the state once the whole session is wrapped up, so the wording has to
  // suit someone whose turn never came around.
  if (place.state === "done") {
    return (
      <Card tone="done" icon={<CheckCircle2 className="h-9 w-9" />} title="You're all done">
        <p className="text-sm">Thanks, {place.name}. Enjoy the rest of the talks.</p>
      </Card>
    );
  }

  const ahead = place.position - 1;
  return (
    <Card
      tone="calm"
      icon={<Hourglass className="h-8 w-8" />}
      title={`You're number ${place.position}`}
    >
      <p className="text-sm text-soft">
        {ahead === 0
          ? `You're first up, ${place.name}.`
          : `${ahead} ${ahead === 1 ? "person is" : "people are"} ahead of you.`}{" "}
        Keep this page open and it&apos;ll tell you when you&apos;re next.
      </p>
    </Card>
  );
}

const TONES = {
  calm: "border-hairline bg-card text-ink",
  warn: "border-warn-line bg-warn-soft text-warn",
  accent: "border-success-line bg-success-soft text-success",
  done: "border-hairline bg-card text-muted",
};

function Card({
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
      className={`flex flex-col items-center gap-3 rounded-panel border-[1.5px] px-6 py-8 text-center ${TONES[tone]} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {icon}
      <p className="text-[1.75rem] leading-tight font-bold tracking-[-0.01em] text-balance">
        {title}
      </p>
      {children}
    </div>
  );
}
