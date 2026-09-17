"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, Mic, Shuffle, Trash2, Users } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { buttonClass, iconButtonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface Signup {
  _id: Id<"presentSignups">;
  name: string;
  position: number;
}

/** Fisher–Yates: every permutation equally likely, unlike sort(() => rand). */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** What taking this row off the list does to the room, in the admin's terms. */
function removalWarning(name: string, index: number, currentIndex: number | undefined): string {
  if (currentIndex !== undefined && index === currentIndex) {
    return `${name} is presenting right now. Removing them hands over to whoever is next, and the clock starts again.`;
  }
  if (currentIndex !== undefined && index < currentIndex) {
    return `${name} has already presented. Nobody else's turn changes.`;
  }
  return `${name} comes off the list. If they still want a slot, they can scan in again and join the bottom.`;
}

interface RosterListProps {
  signups: Signup[];
  /**
   * Whose turn it is, once talks have started. Everyone up to and including
   * this row is pinned — `present.reorder` refuses to move them — and only the
   * queue behind can be rearranged. Omitted while the order is still being set.
   */
  currentIndex?: number;
  /**
   * Whether the clock has been started on the current talk. Until it has, the
   * person on stage is still just the next name on the list and can be moved —
   * `present.reorder` applies the same rule server-side.
   */
  currentStarted?: boolean;
  onReorder: (orderedIds: Id<"presentSignups">[]) => void;
  onRemove: (id: Id<"presentSignups">) => Promise<void> | void;
}

export function RosterList({
  signups,
  currentIndex,
  currentStarted,
  onReorder,
  onRemove,
}: RosterListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // A stray tap on a bin icon would silently wipe someone's place, and their
  // phone with it, so every removal is confirmed.
  const [removing, setRemoving] = useState<{ signup: Signup; index: number } | null>(null);
  const presenting = currentIndex !== undefined;
  // Rows that cannot be moved: everyone who has already presented, plus the
  // person on stage — but only once their clock is running. Kept in step with
  // the same rule in `present.reorder`, which is what actually enforces it.
  const frozen = presenting
    ? Math.min(currentIndex + (currentStarted ? 1 : 0), signups.length)
    : 0;
  const waiting = signups.length - frozen;

  const move = (from: number, to: number) => {
    if (from < frozen || to < frozen || to >= signups.length || from === to) return;
    const next = [...signups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map((s) => s._id));
  };

  const removeButton = (signup: Signup, index: number) => (
    <button
      aria-label={`Remove ${signup.name}`}
      title="Remove from the list"
      onClick={() => setRemoving({ signup, index })}
      className={`${iconButtonClass("danger")} ml-1`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="kicker">
          The order
          <span className="ml-2 tracking-normal normal-case tabular-nums">
            ({signups.length} {signups.length === 1 ? "person" : "people"})
          </span>
        </h2>
        <button
          onClick={() =>
            onReorder([...signups.slice(0, frozen), ...shuffle(signups.slice(frozen))].map((s) => s._id))
          }
          disabled={waiting < 2}
          className={buttonClass("outline")}
          title={presenting ? "Shuffle everyone still waiting" : undefined}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Shuffle
        </button>
      </div>

      {signups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-panel border-[1.5px] border-dashed border-hairline px-6 py-14 text-center">
          <Users className="h-8 w-8 text-faint" />
          <p className="text-sm text-faint">
            Waiting for the first scan. Names land here as people submit them.
          </p>
        </div>
      ) : (
        <>
          <ol className="space-y-1.5">
            {signups.map((signup, i) => {
              const now = presenting && i === currentIndex;
              if (i < frozen) {
                return (
                  <li
                    key={signup._id}
                    className={`flex items-center gap-2 rounded-media border-[1.5px] px-3 py-2 text-sm ${
                      now ? "border-success-line bg-success-soft text-success" : "border-hairline text-faint"
                    }`}
                  >
                    <span className="w-5 tabular-nums">{i + 1}.</span>
                    {now ? (
                      <Mic className="h-4 w-4 shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{signup.name}</span>
                    {now && <span className="kicker shrink-0">Now</span>}
                    {removeButton(signup, i)}
                  </li>
                );
              }

              return (
                <li
                  key={signup._id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => setDragIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) move(dragIndex, i);
                    setDragIndex(null);
                  }}
                  className={`flex items-center gap-2 rounded-media border-[1.5px] px-3 py-2 text-sm ${
                    dragIndex === i
                      ? "border-line bg-card opacity-60"
                      : now
                        ? "border-success-line bg-success-soft text-success"
                        : "border-hairline bg-card"
                  }`}
                >
                  <span className={`w-5 tabular-nums ${now ? "" : "text-faint"}`}>{i + 1}.</span>
                  <GripVertical
                    className={`h-4 w-4 shrink-0 cursor-grab ${now ? "" : "text-faint"}`}
                  />
                  {now && <Mic className="h-4 w-4 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate">{signup.name}</span>
                  {now && <span className="kicker shrink-0">Now</span>}
                  {/* Keyboard-reachable equivalent of dragging. */}
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button
                      aria-label={`Move ${signup.name} up`}
                      onClick={() => move(i, i - 1)}
                      disabled={i === frozen}
                      className={iconButtonClass()}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label={`Move ${signup.name} down`}
                      onClick={() => move(i, i + 1)}
                      disabled={i === signups.length - 1}
                      className={iconButtonClass()}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    {removeButton(signup, i)}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-faint">
            {!presenting
              ? "Drag rows, or use ↑ ↓, to set the order."
              : currentStarted
                ? "Drag rows, or use ↑ ↓, to change who's up next. Latecomers who scan in join the bottom."
                : "The clock hasn't started, so you can still change who goes first. Latecomers who scan in join the bottom."}
          </p>
        </>
      )}

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing ? `Remove ${removing.signup.name}?` : "Remove from the list?"}
        description={
          removing ? removalWarning(removing.signup.name, removing.index, currentIndex) : ""
        }
        confirmLabel="Remove"
        onConfirm={async () => {
          if (removing) await onRemove(removing.signup._id);
        }}
      />
    </section>
  );
}
