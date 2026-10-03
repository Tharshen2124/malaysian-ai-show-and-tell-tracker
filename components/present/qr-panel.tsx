"use client";

import { useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";
import { Check, Copy } from "lucide-react";
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
      <h2 className="text-xs font-medium text-muted-foreground">Scan to join</h2>

      <Card className="gap-0 p-5">
        <div className="mx-auto w-full max-w-xs rounded-lg bg-white p-5">
          {joinUrl ? (
            <QRCode
              value={joinUrl}
              level="M"
              fgColor={QR_FOREGROUND}
              bgColor={QR_BACKGROUND}
              title="Scan to add your name to the presentation order"
              // Scales with the card so it stays crisp blown up on a projector.
              className="h-auto w-full"
            />
          ) : (
            <div className="aspect-square w-full animate-pulse rounded-[0.3rem] bg-black/5" />
          )}
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
    </section>
  );
}
