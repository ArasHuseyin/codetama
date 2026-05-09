import { ELDER_SUBFORM, STAGE_THRESHOLDS, type ClassName, type Creature, type Stage, type State } from "../types.js";
import { activeCreature, generateName, newCreature, replaceCreature } from "./state.js";
import { determineClass, isAdultClass } from "./classes.js";

export interface EvolutionResult {
  state: State;
  changed: boolean;
  events: Array<{ creatureId: string; from: Stage; to: Stage; klass?: ClassName; spawnedNewEgg?: boolean }>;
}

export function checkEvolution(state: State, now: number = Date.now()): EvolutionResult {
  const active = activeCreature(state);
  if (!active) return { state, changed: false, events: [] };

  const eggThreshold = state.history.rebirths > 0 ? STAGE_THRESHOLDS.eggSubsequent : STAGE_THRESHOLDS.eggFirst;
  let result: EvolutionResult = { state, changed: false, events: [] };

  switch (active.stage) {
    case "egg":
      if (active.promptsThisStage >= eggThreshold) {
        result = advance(state, active, "baby", now);
      }
      break;
    case "baby":
      if (active.promptsThisStage >= STAGE_THRESHOLDS.baby) {
        const klass = determineClass(active.stats);
        result = advance(state, active, "adult", now, klass);
      }
      break;
    case "adult":
      if (active.promptsThisStage >= STAGE_THRESHOLDS.adult) {
        const subform = isAdultClass(active.klass) ? ELDER_SUBFORM[active.klass] : null;
        result = advance(state, active, "elder", now, subform ?? undefined);
      }
      break;
    case "elder":
      if (active.promptsThisStage >= STAGE_THRESHOLDS.elder) {
        result = lockAndSpawn(state, active, now);
      }
      break;
  }
  return result;
}

function advance(state: State, creature: Creature, to: Stage, now: number, klass?: ClassName): EvolutionResult {
  const next: Creature = {
    ...creature,
    stage: to,
    klass: klass ?? creature.klass,
    promptsThisStage: 0,
  };
  const newState: State = {
    ...replaceCreature(state, creature.id, next),
    history: {
      ...state.history,
      evolutions: [
        ...state.history.evolutions,
        klass
          ? { at: now, creatureId: creature.id, from: creature.stage, to, klass }
          : { at: now, creatureId: creature.id, from: creature.stage, to },
      ],
    },
  };
  return {
    state: newState,
    changed: true,
    events: [{ creatureId: creature.id, from: creature.stage, to, ...(klass ? { klass } : {}) }],
  };
}

function lockAndSpawn(state: State, elder: Creature, now: number): EvolutionResult {
  const lockedElder: Creature = { ...elder, locked: true };
  const stateWithLocked = replaceCreature(state, elder.id, lockedElder);
  const egg = newCreature(generateName(), now);
  const stateWithEgg: State = {
    ...stateWithLocked,
    creatures: [...stateWithLocked.creatures, egg],
    history: {
      ...stateWithLocked.history,
      rebirths: stateWithLocked.history.rebirths + 1,
      evolutions: [
        ...stateWithLocked.history.evolutions,
        { at: now, creatureId: elder.id, from: "elder", to: "elder" },
      ],
    },
  };
  return {
    state: stateWithEgg,
    changed: true,
    events: [{ creatureId: elder.id, from: "elder", to: "elder", spawnedNewEgg: true }],
  };
}
