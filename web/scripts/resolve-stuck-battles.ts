/**
 * Finds all battles still in `state = "active"` (left over from before
 * the auto-battle change) and simulates them to completion.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { db } = await import("../src/db/client");
  const { battles } = await import("../src/db/schema");
  const { simulateBattleToCompletion } = await import("../src/lib/battle-state");

  const stuck = await db
    .select({ id: battles.id })
    .from(battles)
    .where(eq(battles.state, "active"));

  console.log(`▶ found ${stuck.length} active battle(s)`);
  for (const b of stuck) {
    console.log(`  resolving ${b.id.slice(0, 8)}...`);
    await simulateBattleToCompletion(b.id);
  }
  console.log("✓ done");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ resolve failed:", err);
  process.exit(1);
});
