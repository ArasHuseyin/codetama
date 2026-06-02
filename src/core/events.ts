import { level, type Creature, type State, type CreatureSnapshot, type ViewState } from "../types.js";

export interface EventLine {
  kind: "prompts" | "stats" | "evolved" | "locked" | "died" | "hatched";
  text: string;
}

export function snapshotCreature(c: Creature): CreatureSnapshot {
  return {
    promptsTotal: c.promptsTotal,
    stage: c.stage,
    statsSum: level(c),
    hunger: c.hunger,
    locked: c.locked,
  };
}

export function snapshotState(state: State): Record<string, CreatureSnapshot> {
  const snap: Record<string, CreatureSnapshot> = {};
  for (const c of state.creatures) snap[c.id] = snapshotCreature(c);
  return snap;
}

export function computeEvents(state: State): EventLine[] {
  const view = state.view;
  if (!view) return [];
  const lines: EventLine[] = [];
  const seen = new Set(Object.keys(view.snapshots));

  for (const c of state.creatures) {
    const prev = view.snapshots[c.id];

    if (!prev) {
      lines.push({
        kind: "hatched",
        text: `🥚 ${c.name} hatched`,
      });
      continue;
    }

    seen.delete(c.id);

    if (prev.stage !== "dead" && c.stage === "dead") {
      lines.push({
        kind: "died",
        text: `💀 ${c.name} died`,
      });
      continue;
    }

    if (prev.stage !== c.stage) {
      lines.push({
        kind: "evolved",
        text: `${c.name}: ${prev.stage} → ${c.stage}${c.klass ? ` [${c.klass}]` : ""}`,
      });
    }

    if (!prev.locked && c.locked) {
      lines.push({
        kind: "locked",
        text: `★ ${c.name} peaked — locked at Elder`,
      });
    }

    const promptDelta = c.promptsTotal - prev.promptsTotal;
    if (promptDelta > 0) {
      lines.push({
        kind: "prompts",
        text: `+${promptDelta} prompts`,
      });
    }

    const statDelta = level(c) - prev.statsSum;
    if (statDelta > 0) {
      lines.push({
        kind: "stats",
        text: `+${statDelta} stats`,
      });
    }
  }

  return lines;
}

export function withUpdatedView(state: State, now: number): State {
  const view: ViewState = {
    lastViewedAt: now,
    snapshots: snapshotState(state),
  };
  return { ...state, view };
}
