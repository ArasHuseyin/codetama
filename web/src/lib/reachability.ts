import { db } from "@/db/client";
import { tiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const CAPTURE_REACH = 2;

export function chebyshev(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function isInRange(myTiles: Array<{ x: number; y: number }>, target: { x: number; y: number }): boolean {
  return myTiles.some((t) => chebyshev(t, target) <= CAPTURE_REACH);
}

export async function canAttackerReach(attackerUserId: string, targetX: number, targetY: number): Promise<boolean> {
  const owned = await db
    .select({ x: tiles.x, y: tiles.y })
    .from(tiles)
    .where(eq(tiles.ownerUserId, attackerUserId));
  return isInRange(owned, { x: targetX, y: targetY });
}
