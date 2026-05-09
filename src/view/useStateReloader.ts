import { useEffect, useState } from "react";
import { applyDecayAll, moodOf } from "../core/hunger.js";
import { activeCreature, loadOrInit } from "../core/state.js";
import type { Creature, Mood, State } from "../types.js";

export interface ReloadResult {
  state: State;
  active: Creature | null;
  mood: Mood;
}

export function useStateReloader(intervalMs: number = 1000): ReloadResult {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(handle);
  }, [intervalMs]);

  const now = Date.now();
  const raw = loadOrInit();
  const state = applyDecayAll(raw, now);
  const active = activeCreature(state) ?? state.creatures[state.creatures.length - 1] ?? null;
  return {
    state,
    active,
    mood: active ? moodOf(active) : "sick",
  };
}
