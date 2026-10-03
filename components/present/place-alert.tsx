"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The two moments worth interrupting someone's phone for. */
export type AlertKind = "next" | "presenting";

const COPY: Record<AlertKind, { title: string; body: string; tone: string; icon: React.ReactNode }> =
  {
    next: {
      title: "You're up next!",
      body: "Wrap up what you're doing and make your way to the front.",
      tone: "border-warn-line bg-warn-soft text-warn",
      icon: <Sparkles className="size-12" />,
    },
    presenting: {
      title: "You're presenting now!",
      body: "You're on — go for it.",
      tone: "border-success-line bg-success-soft text-success",
      icon: <Mic className="size-12" />,
    },
  };

/**
 * The full-screen shout that goes with the buzz and the chime. Deliberately not
 * `ModalLayout`: that one is built around a header bar and a form, and this has
 * to read across a dim room at arm's length. Dismissed by tapping anywhere, by
 * Escape, and — from the parent — on a timer, so it never sits on top of the
 * running order once it has been seen.
 */
export function PlaceAlert({ kind, onClose }: { kind: AlertKind | null; onClose: () => void }) {
  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kind, onClose]);

  if (typeof document === "undefined") return null;

  const copy = kind ? COPY[kind] : null;

  return createPortal(
    <AnimatePresence>
      {copy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={onClose}
          // Portalled to <body>, outside app/join's scope, so it re-declares it.
          data-ui="shadcn"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08100e8c] p-5 backdrop-blur-[2px]"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={copy.title}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.2, 0.75, 0.2, 1] }}
            // The tap that dismisses is the scrim's; swallow it here so a tap on
            // the card itself doesn't close what they are still reading.
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border px-6 py-10 text-center shadow-[0_12px_40px_#0000003d]",
              copy.tone,
            )}
          >
            {copy.icon}
            <p className="text-[clamp(2rem,9vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.028em] text-balance">
              {copy.title}
            </p>
            <p className="text-sm">{copy.body}</p>
            <Button onClick={onClose} variant="outline" size="lg" className="mt-2 text-foreground">
              Got it
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
