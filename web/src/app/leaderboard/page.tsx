import { headers } from "next/headers";

export const revalidate = 0;

interface Entry {
  rank: number;
  userId: string;
  username: string | null;
  image: string | null;
  tileCount: number;
  klass: string | null;
  level: number;
  tier: "diamond" | "gold" | "silver" | "bronze";
}

async function fetchLeaderboard(): Promise<Entry[]> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const res = await fetch(`${proto}://${host}/api/leaderboard`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { leaderboard: Entry[] };
  return data.leaderboard;
}

export default async function LeaderboardPage() {
  const entries = await fetchLeaderboard();

  return (
    <main className="space-y-6">
      <header>
        <p className="dim text-sm">/leaderboard</p>
        <h1 className="text-3xl mt-2">leaderboard</h1>
        <p className="dim text-sm mt-1">top 100 trainers, ranked by base count.</p>
      </header>

      {entries.length === 0 ? (
        <section className="panel text-sm dim">
          No bases on the map yet. Be the first.
        </section>
      ) : (
        <section className="panel-tight">
          <table className="w-full text-sm">
            <thead className="dim">
              <tr className="border-b border-fgMuted">
                <th className="text-left py-2 px-3 w-12">#</th>
                <th className="text-left py-2 px-3">trainer</th>
                <th className="text-left py-2 px-3">class</th>
                <th className="text-right py-2 px-3">level</th>
                <th className="text-right py-2 px-3">bases</th>
                <th className="text-right py-2 px-3">tier</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.userId} className="border-b border-fgMuted last:border-0 hover:bg-bgPanel/40">
                  <td className="py-2 px-3 dim">{e.rank}</td>
                  <td className="py-2 px-3 text-fg">{e.username ?? "anonymous"}</td>
                  <td className="py-2 px-3 dim">{e.klass ?? "—"}</td>
                  <td className="py-2 px-3 text-right">{e.level || "—"}</td>
                  <td className="py-2 px-3 text-right text-fg">{e.tileCount}</td>
                  <td className="py-2 px-3 text-right">
                    <TierBadge tier={e.tier} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function TierBadge({ tier }: { tier: Entry["tier"] }) {
  const styles: Record<Entry["tier"], string> = {
    diamond: "border-cyan-300 text-cyan-300",
    gold: "border-yellow-300 text-yellow-300",
    silver: "border-zinc-300 text-zinc-300",
    bronze: "border-fgMuted text-fgMuted",
  };
  return (
    <span className={`border px-2 py-0.5 text-xs uppercase tracking-widest ${styles[tier]}`}>
      {tier}
    </span>
  );
}
