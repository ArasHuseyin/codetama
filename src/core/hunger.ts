import {
  DEATH_AT_ZERO_FOR_HOURS,
  FOOD_VALUES,
  HUNGER_DECAY_PER_HOUR,
  HUNGER_MAX,
  TOOL_STAT_GAIN,
  type Creature,
  type FoodType,
  type Mood,
  type State,
  type Stats,
} from "../types.js";

const MS_PER_HOUR = 3_600_000;

export function applyDecay(creature: Creature, now: number): Creature {
  if (creature.stage === "dead") return creature;

  const elapsedHours = Math.max(0, (now - creature.lastSeenAt) / MS_PER_HOUR);
  const decay = elapsedHours * HUNGER_DECAY_PER_HOUR;
  const newHunger = Math.max(0, creature.hunger - decay);

  let next: Creature = { ...creature, hunger: newHunger, lastSeenAt: now };

  if (newHunger === 0) {
    const hoursStarving = (now - next.lastFedAt) / MS_PER_HOUR;
    if (hoursStarving >= DEATH_AT_ZERO_FOR_HOURS) {
      next = { ...next, stage: "dead", diedAt: now };
    }
  }
  return next;
}

export function applyDecayAll(state: State, now: number): State {
  return {
    ...state,
    creatures: state.creatures.map((c) => applyDecay(c, now)),
  };
}

function feedSingle(creature: Creature, food: FoodType, now: number, isPromptForActive: boolean): Creature {
  if (creature.stage === "dead") return creature;
  const decayed = applyDecay(creature, now);
  if (decayed.stage === "dead") return decayed;

  const value = FOOD_VALUES[food];
  const hunger = Math.min(HUNGER_MAX, decayed.hunger + value.hunger);

  const stats = { ...decayed.stats };
  const statBuffer: Stats = {
    str: decayed.statBuffer?.str ?? 0,
    int: decayed.statBuffer?.int ?? 0,
    dex: decayed.statBuffer?.dex ?? 0,
  };
  if (value.stat) {
    const key = value.stat;
    const current = stats[key];
    // Diminishing returns: each tool contributes 1/sqrt(currentStat) to a
    // fractional buffer. Stronger creatures grow slower; early game stays
    // rewarding (stat 1 → +1 per tool, stat 100 → +1 every 10 tools).
    const gain = TOOL_STAT_GAIN / Math.sqrt(Math.max(1, current));
    statBuffer[key] += gain;
    // Epsilon guards against IEEE-754 drift (e.g. 10 × 0.1 ≠ 1.0).
    const whole = Math.floor(statBuffer[key] + 1e-9);
    if (whole > 0) {
      stats[key] = current + whole;
      statBuffer[key] -= whole;
    }
  }

  const isPrompt = food === "prompt";
  const promptsTotal = decayed.promptsTotal + (isPrompt && isPromptForActive ? 1 : 0);
  const promptsThisStage = decayed.promptsThisStage + (isPrompt && isPromptForActive ? 1 : 0);

  return {
    ...decayed,
    hunger,
    stats,
    statBuffer,
    lastFedAt: now,
    promptsTotal,
    promptsThisStage,
  };
}

/**
 * Feed every living creature. Hunger + tool-stats apply to all.
 * Prompt counter only advances on the active creature (so only it can advance stages).
 */
export function feedAll(state: State, food: FoodType, now: number, activeId: string | null): State {
  return {
    ...state,
    creatures: state.creatures.map((c) =>
      feedSingle(c, food, now, activeId !== null && c.id === activeId),
    ),
  };
}

export function moodOf(creature: Creature): Mood {
  if (creature.stage === "dead") return "sick";
  if (creature.hunger <= 10) return "sick";
  if (creature.hunger <= 30) return "hungry";
  if (creature.promptsThisStage > 30) return "tired";
  if (creature.hunger >= 80) return "happy";
  return "content";
}
