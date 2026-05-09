import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { battles, users } from "@/db/schema";

export const revalidate = 0;

interface BattleRow {
  id: string;
  state: string;
  winnerUserId: string | null;
  attackerUserId: string;
  defenderUserId: string;
  startedAt: Date;
  endedAt: Date | null;
  tileCaptured: boolean;
  challengedTileX: number;
  challengedTileY: number;
}

async function fetchBattles(userId: string): Promise<BattleRow[]> {
  return db
    .select({
      id: battles.id,
      state: battles.state,
      winnerUserId: battles.winnerUserId,
      attackerUserId: battles.attackerUserId,
      defenderUserId: battles.defenderUserId,
      startedAt: battles.startedAt,
      endedAt: battles.endedAt,
      tileCaptured: battles.tileCaptured,
      challengedTileX: battles.challengedTileX,
      challengedTileY: battles.challengedTileY,
    })
    .from(battles)
    .where(or(eq(battles.attackerUserId, userId), eq(battles.defenderUserId, userId)))
    .orderBy(desc(battles.startedAt))
    .limit(20);
}

async function fetchOpponentNames(rows: BattleRow[], userId: string): Promise<Map<string, string | null>> {
  const opponentIds = new Set<string>();
  for (const r of rows) {
    if (r.attackerUserId !== userId) opponentIds.add(r.attackerUserId);
    if (r.defenderUserId !== userId) opponentIds.add(r.defenderUserId);
  }
  if (opponentIds.size === 0) return new Map();
  const list = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, Array.from(opponentIds)));
  return new Map(list.map((u) => [u.id, u.name]));
}

export default async function BattleHistoryPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const [me] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!me) notFound();

  const rows = await fetchBattles(userId);
  const names = await fetchOpponentNames(rows, userId);

  let wins = 0;
  let losses = 0;
  let captures = 0;
  for (const r of rows) {
    if (r.state !== "ended") continue;
    if (r.winnerUserId === userId) wins += 1;
    else if (r.winnerUserId !== null) losses += 1;
    if (r.tileCaptured && r.attackerUserId === userId && r.winnerUserId === userId) captures += 1;
  }

  return (
    <main className="space-y-6 max-w-3xl">
      <header className="space-y-1">
        <p className="dim text-sm">
          /u/<span className="text-fg">{me.name ?? userId.slice(0, 8)}</span>/battles
        </p>
        <h1 className="text-3xl mt-2">battle history</h1>
        <p className="dim text-sm">last 20 battles</p>
      </header>

      <section className="panel-tight grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl text-fg">{wins}</div>
          <div className="text-xs dim uppercase tracking-wider">wins</div>
        </div>
        <div>
          <div className="text-2xl text-fg">{losses}</div>
          <div className="text-xs dim uppercase tracking-wider">losses</div>
        </div>
        <div>
          <div className="text-2xl text-fg">{captures}</div>
          <div className="text-xs dim uppercase tracking-wider">tiles taken</div>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="panel text-sm dim">
          no battles yet. challenge someone on the <Link href="/map" className="text-fg underline">map</Link>.
        </section>
      ) : (
        <section className="panel-tight">
          <table className="w-full text-sm">
            <thead className="dim">
              <tr className="border-b border-fgMuted">
                <th className="text-left py-2 px-3">when</th>
                <th className="text-left py-2 px-3">role</th>
                <th className="text-left py-2 px-3">opponent</th>
                <th className="text-left py-2 px-3">tile</th>
                <th className="text-right py-2 px-3">result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isAttacker = r.attackerUserId === userId;
                const oppId = isAttacker ? r.defenderUserId : r.attackerUserId;
                const oppName = names.get(oppId) ?? oppId.slice(0, 8);
                let result: { label: string; cls: string };
                if (r.state !== "ended") {
                  result = { label: "ongoing", cls: "text-warn" };
                } else if (r.winnerUserId === userId) {
                  result = {
                    label: r.tileCaptured && isAttacker ? "win + tile" : "win",
                    cls: "text-fg",
                  };
                } else if (r.winnerUserId === null) {
                  result = { label: "draw", cls: "dim" };
                } else {
                  result = { label: "loss", cls: "text-accent" };
                }
                return (
                  <tr key={r.id} className="border-b border-fgMuted last:border-0">
                    <td className="py-2 px-3 dim">{r.startedAt.toISOString().slice(0, 10)}</td>
                    <td className="py-2 px-3 dim">{isAttacker ? "→ atk" : "← def"}</td>
                    <td className="py-2 px-3 text-fg">{oppName}</td>
                    <td className="py-2 px-3 dim">
                      ({r.challengedTileX}, {r.challengedTileY})
                    </td>
                    <td className={`py-2 px-3 text-right ${result.cls}`}>{result.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <Link href={`/u/${userId}`} className="text-sm dim hover:text-fg">
        ← back to map
      </Link>
    </main>
  );
}
