"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Hourglass, Mic, Sparkles } from "lucide-react";
import { useChime } from "@/lib/use-chime";

export type PlaceState = "waiting" | "next" | "presenting" | "done";

export interface Place {
  name: string;
  /** 1-based, as it reads on the screen at the front of the room. */
  position: number;
  total: number;
  state: PlaceState;
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

export function AttendeePlace({ place }: { place: Place }) {
  const { chime } = useChime();
  // Alerts fire on the transition into a state, not on every re-render the
  // subscription causes.
  const alertedRef = useRef<PlaceState | null>(null);

  useEffect(() => {
    if (alertedRef.current === place.state) return;
    const first = alertedRef.current === null;
    alertedRef.current = place.state;
    // Nothing should go off just because the page was opened mid-session.
    if (first) return;

    const alert = ALERTS[place.state];
    if (alert) chime(alert.beeps, alert.frequency);
    const pattern = VIBRATE[place.state];
    // Android honours this; iOS Safari has no vibration API, hence the chime.
    if (pattern && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, [place.state, chime]);

  if (place.state === "presenting") {
    return (
      <Card tone="accent" icon={<Mic className="h-9 w-9" />} title="You're up — go!">
        <p className="text-sm">
          You&apos;re number {place.position} of {place.total}.
        </p>
      </Card>
    );
  }

  if (place.state === "next") {
    return (
      <Card
        tone="warn"
        icon={<Sparkles className="h-9 w-9" />}
        title="You're next — get ready"
        pulse
      >
        <p className="text-sm">
          You&apos;re number {place.position} of {place.total}. Head to the front when the current
          talk wraps up.
        </p>
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
    <Card tone="calm" icon={<Hourglass className="h-8 w-8" />} title={`You're number ${place.position}`}>
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
      className={`flex flex-col items-center gap-3 rounded-panel border-[1.5px] px-6 py-12 text-center ${TONES[tone]} ${
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
