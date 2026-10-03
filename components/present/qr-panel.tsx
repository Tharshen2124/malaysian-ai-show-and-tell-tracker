"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "react-qr-code";
import { Check, Copy, Maximize2, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * The QR is always dark-on-white, in its own white plate, in both themes. An
 * inverted code (light modules on the ink-navy page) is a coin flip across
 * phone cameras, and this one is being scanned once, quickly, from across a room.
 */
const QR_FOREGROUND = "#102b2a";
const QR_BACKGROUND = "#ffffff";

// The host is only knowable in the browser — the server has no idea what
// address the room will reach this on. Read through useSyncExternalStore so
// the server render gets `null` instead of a hydration mismatch.
const neverChanges = () => () => {};
const readOrigin = () => window.location.origin;
const noOriginOnServer = () => null;

export function QrPanel({ code }: { code: string }) {
  const toast = useToast();
  const origin = useSyncExternalStore(neverChanges, readOrigin, noOriginOnServer);
  const [copied, setCopied] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  const joinUrl = origin ? `${origin}/join/${code}` : null;
  // Shown without the scheme: it is read off a projector and typed into a phone,
  // and every phone browser fills in https:// on its own.
  const enterCodeAt = origin ? `${origin.replace(/^https?:\/\//, "")}/join` : null;

  const copy = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-muted-foreground">Scan to join</h2>
        <Button onClick={() => setEnlarged(true)} disabled={!joinUrl} variant="outline" size="sm">
          <Maximize2 />
          Enlarge
        </Button>
      </div>

      <Card className="gap-0 p-5">
        <div className="mx-auto w-full max-w-xs rounded-lg bg-white p-5">
          <QrImage joinUrl={joinUrl} />
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-medium text-muted-foreground">Too far to scan? Go to</p>
          <p className="mt-1 text-lg font-bold break-all text-foreground">{enterCodeAt ?? "…"}</p>
          <p className="text-xs font-medium text-muted-foreground mt-3">and enter the code</p>
          {/* Atkinson Hyperlegible is built to keep look-alike characters apart,
              which is exactly the job of a code read off a projector. */}
          <p className="mt-1 text-4xl font-bold tracking-[0.2em] text-foreground tabular-nums">
            {code}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            {joinUrl ?? "…"}
          </code>
          <Button
            onClick={copy}
            disabled={!joinUrl}
            aria-label="Copy the join link"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground border border-border px-3 py-2 max-sm:h-11 max-sm:w-11"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Names appear in the order the moment someone submits — no refresh needed.
      </p>

      <EnlargedQr
        open={enlarged}
        onClose={() => setEnlarged(false)}
        joinUrl={joinUrl}
        enterCodeAt={enterCodeAt}
        code={code}
      />
    </section>
  );
}

function QrImage({ joinUrl }: { joinUrl: string | null }) {
  return joinUrl ? (
    <QRCode
      value={joinUrl}
      level="M"
      fgColor={QR_FOREGROUND}
      bgColor={QR_BACKGROUND}
      title="Scan to add your name to the presentation order"
      // Scales with its container so it stays crisp blown up on a projector.
      className="block h-auto w-full"
    />
  ) : (
    <div className="aspect-square w-full animate-pulse rounded-[0.3rem] bg-black/5" />
  );
}

/**
 * The code and the fallback address, filling the whole screen, for when the
 * panel is too small to scan from the back of the room. Side by side on a
 * landscape screen (the projector), stacked on a portrait one.
 */
function EnlargedQr({
  open,
  onClose,
  joinUrl,
  enterCodeAt,
  code,
}: {
  open: boolean;
  onClose: () => void;
  joinUrl: string | null;
  enterCodeAt: string | null;
  code: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const returnFocusTo = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // The close button is the only thing to focus, so keep Tab on it.
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocusTo?.focus();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          // Portalled outside the dashboard subtree, so re-declare the scope
          // (see ModalLayout).
          data-ui="shadcn"
          role="dialog"
          aria-modal="true"
          aria-label="Scan to join"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-foreground sm:p-10"
        >
          <Button
            ref={closeRef}
            onClick={onClose}
            variant="outline"
            aria-label="Close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6"
          >
            <X />
            Close
          </Button>

          <div className="flex flex-col items-center gap-8 landscape:flex-row landscape:gap-16">
            {/* Sized off the viewport rather than the container: as big as the
                screen allows while leaving room for the code beside or below it. */}
            <div className="w-[min(90vw,60dvh)] rounded-2xl bg-white p-[4%] landscape:w-[min(55vw,82dvh)]">
              <QrImage joinUrl={joinUrl} />
            </div>

            <div className="text-center landscape:text-left">
              <p className="text-base font-medium text-muted-foreground sm:text-xl">
                Too far to scan? Go to
              </p>
              <p className="mt-1 text-2xl font-bold break-all sm:text-4xl">{enterCodeAt ?? "…"}</p>
              <p className="mt-6 text-base font-medium text-muted-foreground sm:text-xl">
                and enter the code
              </p>
              <p className="mt-1 text-5xl font-bold tracking-[0.2em] tabular-nums sm:text-7xl">
                {code}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
