/**
 * Read-only: figures out why a user can't attack — checks per-attacker
 * cooldown, recent matchups (1h pair cooldown), reachable tiles, and
 * active creature.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { eq, sql, and, or, gte, desc } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const PAIR_COOLDOWN_MS = 60 * 60 * 1000;
const ATTACK_COOLDOWN_MINUTES = (() => {
  const raw = process.env.ATTACK_COOLDOWN_MINUTES;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
})();
const ATTACK_COOLDOWN_MS = ATTACK_COOLDOWN_MINUTES * 60 * 1000;

async function main() {
  const { db } = await import("../src/db/client");
  const { users, tiles, battles, creatures } = await import("../src/db/schema");

  const targetName = process.argv[2] ?? "Haras";
  const [me] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.name, targetName))
    .limit(1);
  if (!me) {
    console.log(`✗ user "${targetName}" not found`);
    process.exit(1);
  }
  console.log(`▶ user: ${me.name} (${me.id.slice(0, 8)})`);

  // Active creature
  const [activeCreature] = await db
    .select()
    .from(creatures)
    .where(and(eq(creatures.userId, me.id), eq(creatures.active, true)))
    .limit(1);
  if (!activeCreature) {
    console.log(`✗ NO ACTIVE CREATURE — challenges always fail`);
  } else {
    console.log(`✓ active creature: ${activeCreature.name} (${activeCreature.stage}, ${activeCreature.klass ?? "no class"})`);
  }

  // Per-attacker cooldown
  let cooldownReady = true;
  let cooldownMinsLeft = 0;
  if (ATTACK_COOLDOWN_MS > 0) {
    const [lastAttack] = await db
      .select({ startedAt: battles.startedAt })
      .from(battles)
      .where(eq(battles.attackerUserId, me.id))
      .orderBy(desc(battles.startedAt))
      .limit(1);
    if (lastAttack) {
      const elapsed = Date.now() - lastAttack.startedAt.getTime();
      if (elapsed < ATTACK_COOLDOWN_MS) {
        cooldownReady = false;
        cooldownMinsLeft = Math.ceil((ATTACK_COOLDOWN_MS - elapsed) / 60_000);
      }
    }
  }
  if (cooldownReady) {
    console.log(`✓ attack cooldown: ready (${ATTACK_COOLDOWN_MINUTES}min between attacks)`);
  } else {
    console.log(`✗ attack cooldown: ${cooldownMinsLeft}min left (${ATTACK_COOLDOWN_MINUTES}min between attacks)`);
  }

  // Pair cooldowns
  const cooldownSince = new Date(Date.now() - PAIR_COOLDOWN_MS);
  const cooldowns = await db
    .select({
      attackerId: battles.attackerUserId,
      defenderId: battles.defenderUserId,
      state: battles.state,
      startedAt: battles.startedAt,
    })
    .from(battles)
    .where(
      and(
        or(eq(battles.attackerUserId, me.id), eq(battles.defenderUserId, me.id)),
        gte(battles.startedAt, cooldownSince),
      ),
    );
  if (cooldowns.length > 0) {
    console.log(`\n▶ matchups on 1h cooldown:`);
    for (const c of cooldowns) {
      const oppId = c.attackerId === me.id ? c.defenderId : c.attackerId;
      const minsAgo = Math.floor((Date.now() - c.startedAt.getTime()) / 60000);
      const minsLeft = 60 - minsAgo;
      const [opp] = await db.select({ name: users.name }).from(users).where(eq(users.id, oppId)).limit(1);
      console.log(`  ✗ ${opp?.name ?? oppId.slice(0, 8)} — ${minsAgo}m ago, ${minsLeft}m cooldown left, state=${c.state}`);
    }
  } else {
    console.log(`\n✓ no recent matchups — no pair cooldowns active`);
  }

  // Reachable enemy tiles
  const myTiles = await db.select().from(tiles).where(eq(tiles.ownerUserId, me.id));
  if (myTiles.length === 0) {
    console.log(`\n✗ NO TILES — can't attack from nothing`);
    process.exit(0);
  }
  console.log(`\n▶ your tiles: ${myTiles.map((t) => `(${t.x},${t.y})`).join(", ")}`);

  console.log(`\n▶ reachable enemy tiles (≤2 king-steps):`);
  const allTiles = await db
    .select({ x: tiles.x, y: tiles.y, ownerId: tiles.ownerUserId, ownerName: users.name })
    .from(tiles)
    .innerJoin(users, eq(users.id, tiles.ownerUserId));

  const cooldownOpponents = new Set(
    cooldowns.map((c) => (c.attackerId === me.id ? c.defenderId : c.attackerId)),
  );

  let attackableCount = 0;
  for (const t of allTiles) {
    if (t.ownerId === me.id) continue;
    let minDist = Infinity;
    for (const m of myTiles) {
      const d = Math.max(Math.abs(t.x - m.x), Math.abs(t.y - m.y));
      if (d < minDist) minDist = d;
    }
    if (minDist > 2) continue;
    const blocked = cooldownOpponents.has(t.ownerId);
    const flag = blocked ? "✗ COOLDOWN" : "✓ attackable";
    console.log(`  ${flag}  (${t.x},${t.y}) ${t.ownerName} · ${minDist} step${minDist === 1 ? "" : "s"}`);
    if (!blocked) attackableCount++;
  }

  console.log(`\n▶ summary: ${attackableCount} tiles you can actually challenge right now`);
  if (attackableCount === 0 || !cooldownReady) {
    console.log(`\n✗ NOTHING ATTACKABLE`);
    if (!cooldownReady) console.log(`   → reason: attack cooldown (${cooldownMinsLeft}min left)`);
    if (cooldownOpponents.size > 0)
      console.log(`   → reason: all reachable enemies on 1h pair-cooldown`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("✗ diagnose failed:", err);
  process.exit(1);
});
