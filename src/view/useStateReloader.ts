import { useEffect, useState } from "react";
import { applyDecayAll, moodOf } from "../core/hunger.js";
import { activeCreature, loadOrInit } from "../core/state.js";
import type { Creature, Mood, State } from "../types.js";

export interface ReloadResult {
  state: State | null;
  active: Creature | null;
  mood: Mood;
  error: string | null;
}

export function useStateReloader(intervalMs: number = 1000): ReloadResult {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(handle);
  }, [intervalMs]);

  // The state file can be corrupt or briefly unreadable; never let that crash
  // the live viewer — surface a message and let the next tick recover.
  try {
    const now = Date.now();
    const raw = loadOrInit();
    const state = applyDecayAll(raw, now);
    const active = activeCreature(state) ?? state.creatures[state.creatures.length - 1] ?? null;
    return {
      state,
      active,
      mood: active ? moodOf(active) : "sick",
      error: null,
    };
  } catch (e) {
    return { state: null, active: null, mood: "sick", error: (e as Error).message };
  }
}
