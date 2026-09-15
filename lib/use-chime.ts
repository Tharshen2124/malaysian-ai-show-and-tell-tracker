"use client";

import { useCallback, useRef } from "react";

/**
 * Short beeps from an oscillator — no audio library, no asset files.
 *
 * The AudioContext has to be created or resumed inside a user gesture, or the
 * browser's autoplay policy will silently refuse to make noise later, when a
 * clock runs out with nobody touching the screen. Call `ensureAudio` from a
 * click or a tap; `chime` is then free to fire on its own.
 */
export function useChime() {
  const audioRef = useRef<AudioContext | null>(null);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioRef.current = new Ctor();
    }
    void audioRef.current?.resume();
  }, []);

  /** Each beep is shaped so it doesn't click on start/stop. */
  const chime = useCallback((beeps: number, frequency: number) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    for (let i = 0; i < beeps; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const at = ctx.currentTime + i * 0.55;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
      osc.start(at);
      osc.stop(at + 0.45);
    }
  }, []);

  return { ensureAudio, chime };
}
