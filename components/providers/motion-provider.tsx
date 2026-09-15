"use client";

import { MotionConfig } from "motion/react";
import { ReactNode } from "react";

/**
 * design.md's reduced-motion contract, applied to every `motion` animation in
 * one place: under `prefers-reduced-motion` transforms are dropped but opacity
 * still animates to its end state, so nothing is ever left invisible.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
