// Anti-cheat: cap stat gains based on time elapsed since last sync.
//
// Plausibility model:
// - A real human sends at most ~60 prompts/hour while coding intensely.
// - Each tool-use yields +1 stat. So worst case = ~60 stat gains/hour combined.
// - We multiply by 4× to be generous and not punish bursts.
//
// First sync: there's no previous snapshot. We use the creature's bornAt as
// the implicit baseline (lastSyncedAt = bornAt, stats = 1/1/1) so a freshly
// created creature with maxed stats is capped against its actual age.

const MAX_STAT_GAIN_PER_HOUR = 240;
const HOUR_MS = 3_600_000;
const MIN_ELAPSED_MS = 60 * 1000;

export const BASE_STATS = { str: 1, int: 1, dex: 1 } as const;

export interface PreviousSnapshot {
  lastSyncedAt: Date;
  str: number;
  intStat: number;
  dex: number;
}

export interface IncomingStats {
  str: number;
  int: number;
  dex: number;
}

export interface CapResult {
  stats: IncomingStats;
  capped: boolean;
}

export function capSuspiciousGains(
  prev: PreviousSnapshot | null,
  incoming: IncomingStats,
  now: Date = new Date(),
  fallbackBornAt: Date = now,
): CapResult {
  // First sync: synthesize a baseline from the creature's bornAt so absolute
  // stats are also capped, not just gains.
  const baseline: PreviousSnapshot = prev ?? {
    lastSyncedAt: fallbackBornAt,
    str: BASE_STATS.str,
    intStat: BASE_STATS.int,
    dex: BASE_STATS.dex,
  };

  const elapsedMs = Math.max(MIN_ELAPSED_MS, now.getTime() - baseline.lastSyncedAt.getTime());
  const elapsedHours = elapsedMs / HOUR_MS;
  const allowedTotalGain = Math.ceil(elapsedHours * MAX_STAT_GAIN_PER_HOUR);

  const totalIncoming = incoming.str + incoming.int + incoming.dex;
  const totalPrev = baseline.str + baseline.intStat + baseline.dex;
  const requestedGain = totalIncoming - totalPrev;

  if (requestedGain <= allowedTotalGain) {
    return { stats: incoming, capped: false };
  }

  const ratio = allowedTotalGain / requestedGain;
  const cappedStr = baseline.str + Math.floor((incoming.str - baseline.str) * ratio);
  const cappedInt = baseline.intStat + Math.floor((incoming.int - baseline.intStat) * ratio);
  const cappedDex = baseline.dex + Math.floor((incoming.dex - baseline.dex) * ratio);

  return {
    stats: {
      str: Math.max(baseline.str, cappedStr),
      int: Math.max(baseline.intStat, cappedInt),
      dex: Math.max(baseline.dex, cappedDex),
    },
    capped: true,
  };
}
