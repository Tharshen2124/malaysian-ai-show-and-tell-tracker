"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Play, QrCode } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAccess } from "@/lib/use-access";
import { useToast } from "@/components/providers/toast-provider";
import { QrPanel } from "@/components/present/qr-panel";
import { RosterList } from "@/components/present/roster-list";
import { PresenterTimer } from "@/components/present/presenter-timer";
import { buttonClass } from "@/components/ui/button";

const DEFAULT_PRESENTATION_MINUTES = 3;
const DEFAULT_FEEDBACK_MINUTES = 2;

export default function PresentPage() {
  const router = useRouter();
  const toast = useToast();
  const { isLoading, isAdmin } = useAccess();

  const session = useQuery(api.present.activeSession, isAdmin ? {} : "skip");
  const createSession = useMutation(api.present.createSession);
  const removeSignup = useMutation(api.present.removeSignup);
  const setStatus = useMutation(api.present.setStatus);
  const setCurrentIndex = useMutation(api.present.setCurrentIndex);
  const updateDurations = useMutation(api.present.updateDurations);

  // Dragging a row must move it now, not after a round trip, or it snaps back
  // under the cursor. Convex reconciles this against the server's answer.
  const reorder = useMutation(api.present.reorder).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.present.activeSession, {});
    if (!current) return;
    const byId = new Map(current.signups.map((s) => [s._id, s]));
    const signups = args.orderedIds.flatMap((id, i) => {
      const row = byId.get(id);
      return row ? [{ ...row, position: i }] : [];
    });
    localStore.setQuery(api.present.activeSession, {}, { ...current, signups });
  });

  // Only admins run the room; members get sent back rather than shown a
  // half-working console.
  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/dashboard");
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) return null;

  const heading = (
    <div>
      <h1 className="page-title">So, who presents first?</h1>
      <p className="mt-3 text-sm text-soft">
        Put the QR code on the screen, let people scan in, set the order, then run the clock. The
        code stays up during the talks for anyone who turns up late.
      </p>
    </div>
  );

  const start = async () => {
    try {
      await createSession({
        presentationMinutes: DEFAULT_PRESENTATION_MINUTES,
        feedbackMinutes: DEFAULT_FEEDBACK_MINUTES,
      });
    } catch {
      toast.error("Could not start a session.");
    }
  };

  if (session === undefined) {
    return (
      <div className="space-y-8">
        {heading}
        <div className="h-64 animate-pulse rounded-panel bg-recessed" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="space-y-8">
        {heading}
        <div className="flex flex-col items-center gap-4 rounded-panel border-[1.5px] border-dashed border-hairline px-6 py-16 text-center">
          <QrCode className="h-9 w-9 text-faint" />
          <p className="max-w-sm text-sm text-muted">
            Start a session to put a QR code on the screen. Everyone in the room scans it and adds
            their own name.
          </p>
          <button onClick={start} className={buttonClass("primary", { lift: true })}>
            Start a session
          </button>
        </div>
      </div>
    );
  }

  // "locked" is the stored name for talks being under way; sign-ups and the
  // queue behind the current talk both stay open.
  const presenting = session.status === "locked";
  // One past the end is allowed and meaningful: the last presenter was removed,
  // so everyone has had a turn and the next person to scan in goes straight up.
  const currentIndex = Math.min(Math.max(session.currentIndex ?? 0, 0), session.signups.length);
  const presenterId = session.signups[currentIndex]?._id ?? "nobody";

  const beginTalks = async () => {
    try {
      await setStatus({ sessionId: session._id, status: "locked" });
    } catch {
      toast.error("Could not start the presentations.");
    }
  };

  // One tree for both phases, so the QR code stays put, without a flicker, when
  // the talks start.
  return (
    <div className="space-y-8">
      {!presenting && heading}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Below the clock on a narrow screen, where the clock is what the admin needs. */}
        <div className={presenting ? "max-lg:order-last" : undefined}>
          <QrPanel code={session.code} />
        </div>

        <div className="space-y-6">
          {presenting && (
            <PresenterTimer
              // A fresh clock whenever someone new is on stage — including when
              // the presenter is removed, or another admin's tab moves things on.
              key={presenterId}
              order={session.signups}
              currentIndex={currentIndex}
              onAdvance={async (index) => {
                try {
                  await setCurrentIndex({ sessionId: session._id, index });
                } catch {
                  toast.error("Could not move to the next presenter.");
                }
              }}
              presentationMinutes={session.presentationMinutes}
              feedbackMinutes={session.feedbackMinutes}
              onReopen={async () => {
                try {
                  await setStatus({ sessionId: session._id, status: "collecting" });
                } catch {
                  toast.error("Could not go back to setup.");
                }
              }}
              onFinish={async () => {
                try {
                  await setStatus({ sessionId: session._id, status: "done" });
                  toast.success("Session finished.");
                } catch {
                  toast.error("Could not finish the session.");
                }
              }}
            />
          )}

          <RosterList
            signups={session.signups}
            currentIndex={presenting ? currentIndex : undefined}
            onReorder={async (orderedIds: Id<"presentSignups">[]) => {
              try {
                await reorder({ sessionId: session._id, orderedIds });
              } catch {
                toast.error("Could not save the order — refresh and try again.");
              }
            }}
            onRemove={async (id) => {
              try {
                await removeSignup({ id });
              } catch {
                toast.error("Could not remove that name.");
              }
            }}
          />

          {!presenting && (
            <>
              <DurationFields
                key={`${session.presentationMinutes}-${session.feedbackMinutes}`}
                presentationMinutes={session.presentationMinutes}
                feedbackMinutes={session.feedbackMinutes}
                onCommit={async (presentation, feedbackMinutes) => {
                  try {
                    await updateDurations({
                      sessionId: session._id,
                      presentationMinutes: presentation,
                      feedbackMinutes,
                    });
                  } catch {
                    toast.error("Could not save the timings.");
                  }
                }}
              />

              <button
                onClick={beginTalks}
                disabled={session.signups.length === 0}
                className={`${buttonClass("primary")} w-full py-3`}
              >
                <Play className="h-4 w-4" />
                Start presentations
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DurationFields({
  presentationMinutes,
  feedbackMinutes,
  onCommit,
}: {
  presentationMinutes: number;
  feedbackMinutes: number;
  onCommit: (presentation: number, feedback: number) => void;
}) {
  // Seeded once per mount. The parent keys this component on the saved values,
  // so a change from another admin's tab remounts it with the new numbers
  // rather than fighting a half-typed edit.
  const [presentation, setPresentation] = useState(String(presentationMinutes));
  const [feedback, setFeedback] = useState(String(feedbackMinutes));

  // Committed on blur rather than per keystroke, so half-typed numbers never
  // reach the server.
  const commit = () => {
    const p = Number(presentation);
    const f = Number(feedback);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(f) || f <= 0) {
      setPresentation(String(presentationMinutes));
      setFeedback(String(feedbackMinutes));
      return;
    }
    if (p === presentationMinutes && f === feedbackMinutes) return;
    onCommit(p, f);
  };

  const field = "field-input w-20 text-center";

  return (
    <div className="card-surface p-4">
      <h2 className="kicker mb-3">Time per person</h2>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={120}
            value={presentation}
            onChange={(e) => setPresentation(e.target.value)}
            onBlur={commit}
            className={field}
          />
          <span className="text-muted">min presentation</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={120}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onBlur={commit}
            className={field}
          />
          <span className="text-muted">min feedback</span>
        </label>
      </div>
      <p className="mt-2 text-xs text-faint">
        One chime hands over to feedback; three lower ones end the slot.
      </p>
    </div>
  );
}
