import { db } from "@/db/client";
import { battles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const DEFAULT_COOLDOWN_MINUTES = 60;

export interface AttackCooldown {
  ready: boolean;
  readyAt: Date | null;
  remainingMs: number;
  cooldownMs: number;
}

export function attackCooldownMs(): number {
  const raw = process.env.ATTACK_COOLDOWN_MINUTES;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  const minutes = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_COOLDOWN_MINUTES;
  return minutes * 60 * 1000;
}

export async function computeAttackCooldown(
  userId: string,
  now: Date = new Date(),
): Promise<AttackCooldown> {
  const cooldownMs = attackCooldownMs();
  if (cooldownMs === 0) {
    return { ready: true, readyAt: null, remainingMs: 0, cooldownMs: 0 };
  }

  const [last] = await db
    .select({ startedAt: battles.startedAt })
    .from(battles)
    .where(eq(battles.attackerUserId, userId))
    .orderBy(desc(battles.startedAt))
    .limit(1);

  if (!last) return { ready: true, readyAt: null, remainingMs: 0, cooldownMs };

  const readyAt = new Date(last.startedAt.getTime() + cooldownMs);
  const remainingMs = Math.max(0, readyAt.getTime() - now.getTime());
  return { ready: remainingMs === 0, readyAt, remainingMs, cooldownMs };
}
