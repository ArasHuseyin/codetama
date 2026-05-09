import { BALANCED_RATIO, type ClassName, type Stats } from "../types.js";

type AdultClass = "warrior" | "sage" | "trickster" | "balanced";

export function determineClass(stats: Stats): AdultClass {
  const values = [stats.str, stats.int, stats.dex];
  const max = Math.max(...values);
  const min = Math.min(...values);

  if (min > 0 && max <= BALANCED_RATIO * min) return "balanced";

  if (stats.str === max) return "warrior";
  if (stats.int === max) return "sage";
  return "trickster";
}

export interface PathProbabilities {
  warrior: number;
  sage: number;
  trickster: number;
  balanced: number;
}

export function pathProbabilities(stats: Stats): PathProbabilities {
  const values = [stats.str, stats.int, stats.dex];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const total = values.reduce((sum, v) => sum + v, 0) || 1;

  const balancedScore = min > 0 ? Math.max(0, 1 - (max - min) / (BALANCED_RATIO * min - min || 1)) : 0;
  const balancedClamped = Math.max(0, Math.min(1, balancedScore));

  const remaining = 1 - balancedClamped;
  const warrior = (stats.str / total) * remaining;
  const sage = (stats.int / total) * remaining;
  const trickster = (stats.dex / total) * remaining;

  return {
    warrior: round2(warrior),
    sage: round2(sage),
    trickster: round2(trickster),
    balanced: round2(balancedClamped),
  };
}

export function rankedPaths(stats: Stats): Array<{ klass: AdultClass; pct: number }> {
  const p = pathProbabilities(stats);
  return (Object.entries(p) as Array<[AdultClass, number]>)
    .map(([klass, pct]) => ({ klass, pct }))
    .sort((a, b) => b.pct - a.pct);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isAdultClass(klass: ClassName | null): klass is AdultClass {
  return klass === "warrior" || klass === "sage" || klass === "trickster" || klass === "balanced";
}
