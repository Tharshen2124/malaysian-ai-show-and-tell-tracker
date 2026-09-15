"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { iconButtonClass } from "./button";

interface ModalLayoutProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Wider variant for detail modals. */
  wide?: boolean;
  /** Icon-only actions rendered in the header, before the close button. */
  headerActions?: ReactNode;
  /** Fixed area below the scrollable content, always visible without scrolling. */
  footer?: ReactNode;
}

export function ModalLayout({
  open,
  onClose,
  title,
  children,
  wide,
  headerActions,
  footer,
}: ModalLayoutProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close + scroll lock + focus trap entry.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("input, select, textarea, button:not([aria-label='Close'])")
        ?.focus();
    }, 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-scrim p-0 sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: [0.2, 0.75, 0.2, 1] }}
            className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-panel border border-hairline bg-card-raised shadow-float sm:rounded-panel ${
              wide ? "sm:max-w-2xl" : "sm:max-w-lg"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
              <h2 className="text-[1.25rem]">{title}</h2>
              <div className="flex shrink-0 items-center gap-1">
                {headerActions}
                <button aria-label="Close" onClick={onClose} className={iconButtonClass()}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-hairline px-5 py-3">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
