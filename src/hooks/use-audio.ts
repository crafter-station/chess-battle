"use client";

import { useCallback, useRef } from "react";

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const ensureAudio = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const AC: typeof AudioContext =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!audioCtxRef.current && AC) {
      const ctx = new AC();
      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "running") {
      try {
        await audioCtxRef.current.resume();
      } catch {}
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback((freq = 560, durationMs = 80, volume = 0.12) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
    env.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + durationMs / 1000,
    );
    osc.connect(env);
    env.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  }, []);

  const playVictory = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const notes = [523.25, 659.25, 783.99]; // C5-E5-G5
    const startAt = ctx.currentTime;
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t0 = startAt + index * 0.12;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(0.12, t0 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(env);
      env.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }, []);

  return {
    ensureAudio,
    playBeep,
    playVictory,
  };
}
