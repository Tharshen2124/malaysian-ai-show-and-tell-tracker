"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Mic,
  Shuffle,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

/** Matches `MAX_NAME_LENGTH` in `convex/present.ts`. */
const MAX_NAME_LENGTH = 60;

export interface Signup {
  _id: Id<"presentSignups">;
  name: string;
  position: number;
}

/** Truncated beside the controls on a wide screen; wrapped on a phone, where
 *  the touch-sized buttons leave too little room to read a name cut short. */
const NAME_CLASS =
  "min-w-0 flex-1 truncate max-sm:whitespace-normal max-sm:[overflow-wrap:anywhere] max-sm:py-2";

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
  /**
   * Put a name on the list by hand, for whoever could not scan. Resolves true
   * once it has landed; false means it was rejected and the box keeps what was
   * typed so it can be fixed rather than retyped.
   */
  onAdd: (name: string) => Promise<boolean>;
}

export function RosterList({
  signups,
  currentIndex,
  currentStarted,
  onReorder,
  onRemove,
  onAdd,
}: RosterListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // A stray tap on a bin icon would silently wipe someone's place, and their
  // phone with it, so every removal is confirmed.
  const [removing, setRemoving] = useState<{ signup: Signup; index: number } | null>(null);
  const presenting = currentIndex !== undefined;
  // Rows that cannot be moved: everyone who has already presented, plus the
  // person on stage — but only once their clock is running. Kept in step with
  // the same rule in `present.reorder`, which is what actually enforces it.
  const frozen = presenting ? Math.min(currentIndex + (currentStarted ? 1 : 0), signups.length) : 0;
  const waiting = signups.length - frozen;

  const move = (from: number, to: number) => {
    if (from < frozen || to < frozen || to >= signups.length || from === to) return;
    const next = [...signups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map((s) => s._id));
  };

  const removeButton = (signup: Signup, index: number) => (
    <Button
      aria-label={`Remove ${signup.name}`}
      title="Remove from the list"
      onClick={() => setRemoving({ signup, index })}
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:ml-1"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-muted-foreground">
          The order
          <span className="ml-2 tracking-normal normal-case tabular-nums">
            ({signups.length} {signups.length === 1 ? "person" : "people"})
          </span>
        </h2>
        <Button
          onClick={() =>
            onReorder(
              [...signups.slice(0, frozen), ...shuffle(signups.slice(frozen))].map((s) => s._id),
            )
          }
          disabled={waiting < 2}
          variant="outline"
          title={presenting ? "Shuffle everyone still waiting" : undefined}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Shuffle
        </Button>
      </div>

      <AddSignupForm onAdd={onAdd} />

      {signups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Waiting for the first scan. Names land here as people submit them — or add them
            yourself above.
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
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm max-sm:gap-1.5 max-sm:py-0.5 max-sm:pr-1 ${
                      now
                        ? "border-success-line bg-success-soft text-success"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="w-5 tabular-nums">{i + 1}.</span>
                    {now ? (
                      <Mic className="h-4 w-4 shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    <span className={NAME_CLASS}>{signup.name}</span>
                    {now && (
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        Now
                      </span>
                    )}
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
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm max-sm:gap-1.5 max-sm:py-0.5 max-sm:pr-1 ${
                    dragIndex === i
                      ? "border-border bg-card opacity-60"
                      : now
                        ? "border-success-line bg-success-soft text-success"
                        : "border-border bg-card"
                  }`}
                >
                  <span className={`w-5 tabular-nums ${now ? "" : "text-muted-foreground"}`}>
                    {i + 1}.
                  </span>
                  {/* HTML5 drag never fires from a touch, so on a phone the
                      grip would promise something it cannot do; ↑ ↓ do it there. */}
                  <GripVertical
                    className={`h-4 w-4 shrink-0 cursor-grab max-sm:hidden ${now ? "" : "text-muted-foreground"}`}
                  />
                  {now && <Mic className="h-4 w-4 shrink-0" />}
                  <span className={NAME_CLASS}>{signup.name}</span>
                  {now && (
                    <span className="text-xs font-medium text-muted-foreground shrink-0">Now</span>
                  )}
                  {/* Keyboard-reachable equivalent of dragging. */}
                  <span className="flex shrink-0 items-center gap-0.5">
                    <Button
                      aria-label={`Move ${signup.name} up`}
                      onClick={() => move(i, i - 1)}
                      disabled={i === frozen}
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      aria-label={`Move ${signup.name} down`}
                      onClick={() => move(i, i + 1)}
                      disabled={i === signups.length - 1}
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    {removeButton(signup, i)}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-muted-foreground">
            {!presenting ? (
              <>
                <span className="max-sm:hidden">Drag rows, or use ↑ ↓, to set the order.</span>
                <span className="sm:hidden">Use ↑ ↓ to set the order.</span>
              </>
            ) : currentStarted ? (
              <>
                <span className="max-sm:hidden">Drag rows, or use ↑ ↓, to change who&apos;s up next.</span>
                <span className="sm:hidden">Use ↑ ↓ to change who&apos;s up next.</span>{" "}
                Latecomers who scan in join the bottom.
              </>
            ) : (
              "The clock hasn't started, so you can still change who goes first. Latecomers who scan in join the bottom."
            )}
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

/**
 * The organiser typing in someone who is not going to scan: a flat phone, a
 * camera that will not focus, or the person who just put their hand up. The
 * name joins the bottom of the list exactly as a scan would.
 */
function AddSignupForm({ onAdd }: { onAdd: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "" || pending) return;
    setPending(true);
    try {
      if (await onAdd(trimmed)) setName("");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        enterKeyHint="done"
        placeholder="Add someone who couldn't scan"
        aria-label="Name to add to the order"
        className="flex-1"
      />
      <Button type="submit" disabled={name.trim() === "" || pending} variant="outline">
        <UserPlus className="h-3.5 w-3.5" />
        Add
      </Button>
    </form>
  );
}
