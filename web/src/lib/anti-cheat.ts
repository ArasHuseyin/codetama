// Anti-cheat: cap stat gains based on time elapsed since last sync.
//
// Plausibility model:
// - A real human sends at most ~60 prompts/hour while coding intensely.
// - Each tool-use yields +1 stat. So worst case = ~60 stat gains/hour combined.
// - We multiply by 4× to be generous and not punish bursts.

const MAX_STAT_GAIN_PER_HOUR = 240;
const HOUR_MS = 3_600_000;
const MIN_ELAPSED_MS = 60 * 1000;

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
): CapResult {
  if (!prev) return { stats: incoming, capped: false };

  const elapsedMs = Math.max(MIN_ELAPSED_MS, now.getTime() - prev.lastSyncedAt.getTime());
  const elapsedHours = elapsedMs / HOUR_MS;
  const allowedTotalGain = Math.ceil(elapsedHours * MAX_STAT_GAIN_PER_HOUR);

  const totalIncoming = incoming.str + incoming.int + incoming.dex;
  const totalPrev = prev.str + prev.intStat + prev.dex;
  const requestedGain = totalIncoming - totalPrev;

  if (requestedGain <= allowedTotalGain) {
    return { stats: incoming, capped: false };
  }

  const ratio = allowedTotalGain / requestedGain;
  const cappedStr = prev.str + Math.floor((incoming.str - prev.str) * ratio);
  const cappedInt = prev.intStat + Math.floor((incoming.int - prev.intStat) * ratio);
  const cappedDex = prev.dex + Math.floor((incoming.dex - prev.dex) * ratio);

  return {
    stats: {
      str: Math.max(prev.str, cappedStr),
      int: Math.max(prev.intStat, cappedInt),
      dex: Math.max(prev.dex, cappedDex),
    },
    capped: true,
  };
}
