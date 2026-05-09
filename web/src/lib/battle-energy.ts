import { db } from "@/db/client";
import { battles } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";

export const MAX_BATTLE_ENERGY = 5;
export const REGEN_HOURS = 4;

const HOUR_MS = 3_600_000;

export interface EnergyState {
  available: number;
  max: number;
  nextRegenInMs: number;
}

export async function computeEnergy(userId: string, now: Date = new Date()): Promise<EnergyState> {
  const since = new Date(now.getTime() - 24 * HOUR_MS);
  const recent = await db
    .select({ startedAt: battles.startedAt })
    .from(battles)
    .where(and(eq(battles.attackerUserId, userId), gte(battles.startedAt, since)));

  // Each battle in the last 24h consumed 1 energy. Energy regenerates 1 every REGEN_HOURS.
  // available = MAX - consumed + regenerated_since_consumption
  // Simplified: count battles started within last (MAX_BATTLE_ENERGY * REGEN_HOURS) hours.
  const windowMs = MAX_BATTLE_ENERGY * REGEN_HOURS * HOUR_MS;
  const cutoff = now.getTime() - windowMs;
  const consumed = recent.filter((b) => b.startedAt.getTime() >= cutoff).length;
  const available = Math.max(0, MAX_BATTLE_ENERGY - consumed);

  let nextRegenInMs = 0;
  if (available < MAX_BATTLE_ENERGY) {
    const sortedAsc = recent
      .filter((b) => b.startedAt.getTime() >= cutoff)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    const oldest = sortedAsc[0];
    if (oldest) {
      const expiresAt = oldest.startedAt.getTime() + REGEN_HOURS * HOUR_MS;
      nextRegenInMs = Math.max(0, expiresAt - now.getTime());
    }
  }

  return { available, max: MAX_BATTLE_ENERGY, nextRegenInMs };
}
