"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Shuffle, Trash2, Users } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { buttonClass, iconButtonClass } from "@/components/ui/button";

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

interface RosterListProps {
  signups: Signup[];
  onReorder: (orderedIds: Id<"presentSignups">[]) => void;
  onRemove: (id: Id<"presentSignups">) => void;
}

export function RosterList({ signups, onReorder, onRemove }: RosterListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= signups.length || from === to) return;
    const next = [...signups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map((s) => s._id));
  };

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
          onClick={() => onReorder(shuffle(signups).map((s) => s._id))}
          disabled={signups.length < 2}
          className={buttonClass("outline")}
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
            {signups.map((signup, i) => (
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
                className={`flex items-center gap-2 rounded-media border-[1.5px] bg-card px-3 py-2 text-sm ${
                  dragIndex === i ? "border-line opacity-60" : "border-hairline"
                }`}
              >
                <span className="w-5 text-faint tabular-nums">{i + 1}.</span>
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-faint" />
                <span className="min-w-0 flex-1 truncate">{signup.name}</span>
                {/* Keyboard-reachable equivalent of dragging. */}
                <span className="flex shrink-0 items-center gap-0.5">
                  <button
                    aria-label={`Move ${signup.name} up`}
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
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
                  <button
                    aria-label={`Remove ${signup.name}`}
                    onClick={() => onRemove(signup._id)}
                    className={`${iconButtonClass("danger")} ml-1`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-faint">Drag rows, or use ↑ ↓, to set the order.</p>
        </>
      )}
    </section>
  );
}
