/**
 * Wipes all gameplay data and seeds 50 users with varied stages, classes,
 * stats, and tile positions. Run with:
 *
 *   SEED_CONFIRM=wipe-and-seed npm run db:seed
 *
 * Without the env var, the script aborts as a safety net.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { sql } from "drizzle-orm";

// Load env BEFORE importing db (which reads DATABASE_URL at import time).
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set. Check your .env file.");
  process.exit(1);
}

if (process.env.SEED_CONFIRM !== "wipe-and-seed") {
  console.error("⚠️  This script wipes ALL gameplay data and seeds 50 users.");
  console.error("    Re-run with: SEED_CONFIRM=wipe-and-seed npm run db:seed");
  process.exit(1);
}

// Dynamic import so dotenv runs first.
async function main() {
  const { db } = await import("../src/db/client");
  const {
    users,
    accounts,
    sessions,
    verificationTokens,
    cliTokens,
    creatures,
    tiles,
    battles,
    battleTurns,
    events,
  } = await import("../src/db/schema");
  const { spiralIndexToXY } = await import("../src/lib/spawn");

  console.log(`▶ connecting to: ${process.env.DATABASE_URL!.replace(/:[^:@]+@/, ":****@")}`);
  console.log("▶ wiping data...");

  // Delete in dependency-safe order (FK cascade also handles most of it).
  await db.delete(events);
  await db.delete(battleTurns);
  await db.delete(battles);
  await db.delete(tiles);
  await db.delete(creatures);
  await db.delete(cliTokens);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(verificationTokens);
  await db.delete(users);

  console.log("✓ wiped. seeding 50 users...");

  const now = new Date();
  const occupied = new Set<string>();
  const ownedByUser = new Map<string, Array<{ x: number; y: number }>>();
  const userIdsByIdx: string[] = [];
  const creatureIdsByIdx: string[] = [];
  const bornAtByIdx: Date[] = [];
  let nextSpiralIdx = SEED_USERS.length;

  function key(p: { x: number; y: number }): string {
    return `${p.x},${p.y}`;
  }

  function findFreeAdjacent(homeTiles: Array<{ x: number; y: number }>): { x: number; y: number } {
    // Try king-step neighbors at expanding radius around any owned tile.
    for (let r = 1; r <= 4; r++) {
      const candidates: Array<{ x: number; y: number }> = [];
      for (const home of homeTiles) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            candidates.push({ x: home.x + dx, y: home.y + dy });
          }
        }
      }
      // shuffle for organic look
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
      }
      for (const c of candidates) {
        if (!occupied.has(key(c))) return c;
      }
    }
    // Fallback: continue the spiral.
    while (true) {
      const pos = spiralIndexToXY(nextSpiralIdx++);
      if (!occupied.has(key(pos))) return pos;
    }
  }

  // Pass 1: insert users + creatures + home tiles.
  for (let i = 0; i < SEED_USERS.length; i++) {
    const u = SEED_USERS[i]!;
    const dist = distributionFor(i);
    const userId = randomUUID();
    const creatureId = randomUUID();
    const tilePos = spiralIndexToXY(i);

    const bornDaysAgo = 1 + Math.floor(Math.random() * 35);
    const bornAt = new Date(now.getTime() - bornDaysAgo * 24 * 3600 * 1000);
    const lastFedHrsAgo = Math.floor(Math.random() * 18);
    const lastFedAt = new Date(now.getTime() - lastFedHrsAgo * 3600 * 1000);

    const streakDays = Math.floor(Math.random() * 22);
    const streakLongest = streakDays + Math.floor(Math.random() * 30);

    await db.insert(users).values({
      id: userId,
      name: u.name,
      email: null,
      emailVerified: null,
      image: u.image ?? null,
      createdAt: bornAt,
      streakDays,
      streakLongest,
      streakLastDay: streakDays > 0 ? toISODate(now) : null,
    });

    await db.insert(creatures).values({
      id: creatureId,
      userId,
      name: u.creatureName,
      stage: dist.stage,
      klass: dist.klass,
      str: dist.stats.str,
      intStat: dist.stats.int,
      dex: dist.stats.dex,
      hunger: 30 + Math.floor(Math.random() * 60),
      promptsTotal: dist.promptsTotal,
      promptsThisStage: dist.promptsThisStage,
      bornAt,
      lastFedAt,
      lastSyncedAt: now,
      diedAt: null,
      rebirths: dist.stage === "elder" ? Math.floor(Math.random() * 3) : 0,
      active: true,
    });

    await db.insert(tiles).values({
      x: tilePos.x,
      y: tilePos.y,
      ownerUserId: userId,
      baseCreatureId: creatureId,
      acquiredAt: bornAt,
    });

    occupied.add(key(tilePos));
    ownedByUser.set(userId, [tilePos]);
    userIdsByIdx.push(userId);
    creatureIdsByIdx.push(creatureId);
    bornAtByIdx.push(bornAt);
  }

  // Pass 2: bonus tiles for stronger users.
  // Layout idx 0-9 baby, 10-37 adult, 38-49 elder.
  const bonusByIdx: Record<number, number> = {};
  for (let i = 38; i <= 40; i++) bonusByIdx[i] = 4 + Math.floor(Math.random() * 3); // top 3 elders: 4-6 extras
  for (let i = 41; i <= 44; i++) bonusByIdx[i] = 2 + Math.floor(Math.random() * 2); // mid elders: 2-3
  for (let i = 45; i <= 49; i++) bonusByIdx[i] = 1 + Math.floor(Math.random() * 2); // lower elders: 1-2
  for (let i = 30; i <= 37; i++) bonusByIdx[i] = Math.random() < 0.7 ? 1 : 0;       // strong adults: ~70% get +1

  let bonusCount = 0;
  for (const idxStr of Object.keys(bonusByIdx)) {
    const idx = Number(idxStr);
    const extras = bonusByIdx[idx]!;
    const userId = userIdsByIdx[idx]!;
    const creatureId = creatureIdsByIdx[idx]!;
    const homeBornAt = bornAtByIdx[idx]!;
    const homeTiles = ownedByUser.get(userId)!;

    for (let j = 0; j < extras; j++) {
      const pos = findFreeAdjacent(homeTiles);
      // tile acquired some time after home — random offset 1-30 days
      const acquiredAt = new Date(
        homeBornAt.getTime() + (1 + Math.floor(Math.random() * 30)) * 24 * 3600 * 1000,
      );
      const cappedAcquired = acquiredAt > now ? now : acquiredAt;

      await db.insert(tiles).values({
        x: pos.x,
        y: pos.y,
        ownerUserId: userId,
        baseCreatureId: creatureId,
        acquiredAt: cappedAcquired,
      });

      occupied.add(key(pos));
      homeTiles.push(pos);
      bonusCount++;
    }
  }

  console.log(`✓ seeded 50 users · 50 creatures · ${50 + bonusCount} tiles (50 home + ${bonusCount} bonus)`);

  // sanity counts
  const [{ count: userCount }] = await db
    .select({ count: countAll() })
    .from(users);
  const [{ count: creatureCount }] = await db
    .select({ count: countAll() })
    .from(creatures);
  const [{ count: tileCount }] = await db
    .select({ count: countAll() })
    .from(tiles);
  console.log(`✓ db now: ${userCount} users · ${creatureCount} creatures · ${tileCount} tiles`);

  process.exit(0);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function countAll() {
  return sql<number>`count(*)::int`;
}

// ── Distribution helpers ─────────────────────────────────────────────

interface Stats { str: number; int: number; dex: number }
interface Distribution {
  stage: "baby" | "adult" | "elder";
  klass: string | null;
  stats: Stats;
  promptsTotal: number;
  promptsThisStage: number;
}

function distributionFor(i: number): Distribution {
  // Layout: 10 baby · 28 adult (7 each) · 12 elder (3 each)
  if (i < 10) {
    const lv = 3 + Math.floor(Math.random() * 4);
    return {
      stage: "baby",
      klass: null,
      stats: balancedStats(lv),
      promptsTotal: 6 + Math.floor(Math.random() * 14),
      promptsThisStage: Math.floor(Math.random() * 18),
    };
  }
  if (i < 38) {
    const adultIdx = i - 10;
    const klassIdx = Math.floor(adultIdx / 7);
    const klass = ["warrior", "sage", "trickster", "balanced"][klassIdx]!;
    const lv = 8 + Math.floor(Math.random() * 60);
    return {
      stage: "adult",
      klass,
      stats: classStats(klass, lv),
      promptsTotal: 26 + Math.floor(Math.random() * 50),
      promptsThisStage: Math.floor(Math.random() * 28),
    };
  }
  // 38-49: elder
  const elderIdx = i - 38;
  const klassIdx = Math.floor(elderIdx / 3);
  const klass = ["warlord", "archmage", "shadow", "druid"][klassIdx]!;
  const lv = 50 + Math.floor(Math.random() * 180);
  return {
    stage: "elder",
    klass,
    stats: classStats(klass, lv),
    promptsTotal: 80 + Math.floor(Math.random() * 200),
    promptsThisStage: 30 + Math.floor(Math.random() * 10),
  };
}

function balancedStats(lv: number): Stats {
  const each = Math.max(1, Math.floor(lv / 3));
  const wobble = () => Math.floor(Math.random() * 2);
  return { str: each + wobble(), int: each + wobble(), dex: each + wobble() };
}

function classStats(klass: string, lv: number): Stats {
  const dominant = Math.max(2, Math.floor(lv * (0.5 + Math.random() * 0.15)));
  const remaining = Math.max(0, lv - dominant);
  const a = Math.max(1, Math.floor(remaining * (0.4 + Math.random() * 0.2)));
  const b = Math.max(1, remaining - a);

  switch (klass) {
    case "warrior":
    case "warlord":
      return { str: dominant, int: a, dex: b };
    case "sage":
    case "archmage":
      return { str: a, int: dominant, dex: b };
    case "trickster":
    case "shadow":
      return { str: a, int: b, dex: dominant };
    case "balanced":
    case "druid":
      return balancedStats(lv);
    default:
      return balancedStats(lv);
  }
}

// ── Seed users ──────────────────────────────────────────────────────

interface SeedUser {
  name: string;
  creatureName: string;
  image?: string | null;
}

const ADJ = [
  "Plucky", "Grumpy", "Snappy", "Wibbly", "Cosmic", "Tiny", "Mighty", "Sneaky",
  "Brave", "Curious", "Bouncy", "Fluffy", "Jolly", "Witty", "Zany", "Brisk",
  "Quirky", "Drowsy", "Spry", "Crusty",
];
const NOUN = [
  "Janet", "Pip", "Bork", "Ziggy", "Tofu", "Gizmo", "Mochi", "Bean",
  "Pickle", "Noodle", "Biscuit", "Pebble", "Acorn", "Whisker", "Sprig", "Toast",
];

const USERNAMES = [
  "alex_morgan", "kira_dev", "ben_42", "codingowl", "mike_hex",
  "anna_sky", "devnull42", "chris_arc", "sara_byte", "tom_kernel",
  "eva_async", "jason_bits", "nina_loops", "paul_node", "lily_codes",
  "ryan_404", "mei_lin", "otto_dev", "zoe_yield", "jake_compile",
  "yoshi_dev", "alma_tech", "felix_hash", "mei_chen", "ben_hugo",
  "luca_dev", "iris_codes", "dario_byte", "rosa_bug", "ola_dev",
  "miro_codes", "tin_hash", "nora_nix", "aki_terminal", "liam_buf",
  "sam_arc", "jenny_byte", "raul_codes", "ines_dev", "polly_pug",
  "takeshi_42", "amir_codes", "lila_dev", "mateo_hash", "jin_async",
  "wren_dev", "bjorn_byte", "chris_pi", "omid_pkg", "aya_codes",
];

function seedUserAt(idx: number): SeedUser {
  const name = USERNAMES[idx % USERNAMES.length]!;
  // Deterministic but varied creature name from seeded hash so re-runs differ but seed-pos stays stable.
  const h = createHash("md5").update(name + idx.toString()).digest();
  const adj = ADJ[h[0]! % ADJ.length]!;
  const noun = NOUN[h[1]! % NOUN.length]!;
  return { name, creatureName: `${adj} ${noun}` };
}

const SEED_USERS: SeedUser[] = Array.from({ length: 50 }, (_, i) => seedUserAt(i));

main().catch((err) => {
  console.error("✗ seed failed:", err);
  process.exit(1);
});
