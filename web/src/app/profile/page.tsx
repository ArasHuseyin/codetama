import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { listTokens } from "@/lib/tokens";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { TokenManager } from "./TokenManager";
import { DeleteAccount } from "./DeleteAccount";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tokens = await listTokens(session.user.id);
  const sorted = tokens
    .slice()
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const [me] = await db
    .select({
      streakDays: users.streakDays,
      streakLongest: users.streakLongest,
      streakLastDay: users.streakLastDay,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const today = new Date().toISOString().slice(0, 10);
  const streakActive = me?.streakLastDay === today;
  const streakDays = streakActive ? (me?.streakDays ?? 0) : 0;

  return (
    <main className="space-y-10">
      <header className="space-y-2">
        <p className="dim text-sm">/profile</p>
        <h1 className="text-3xl">{session.user.name ?? "anonymous"}</h1>
        <p className="text-sm dim">{session.user.email}</p>
        {(streakDays > 0 || (me?.streakLongest ?? 0) > 0) && (
          <p className="text-sm">
            <span className="dim">streak:</span>{" "}
            <span className={streakDays > 0 ? "text-fg" : "muted"}>
              {streakDays > 0 ? `${streakDays >= 7 ? "🔥" : "•"} ${streakDays} day${streakDays === 1 ? "" : "s"}` : "broken"}
            </span>
            {(me?.streakLongest ?? 0) > streakDays && (
              <span className="dim"> · best {me?.streakLongest}</span>
            )}
          </p>
        )}
      </header>

      <section className="panel space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg">CLI tokens</h2>
          <span className="text-xs muted">copy once · stored hashed · revoke anytime</span>
        </div>
        <p className="text-sm dim">
          Generate a token, then run <code className="text-fg">codetama --register</code> in your
          terminal and paste it.
        </p>

        <TokenManager
          existing={sorted.map((t) => ({
            id: t.id,
            name: t.name,
            prefix: t.prefix,
            createdAt: t.createdAt.toISOString(),
            lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
            revoked: t.revoked,
          }))}
        />
      </section>

      <section className="panel space-y-3">
        <h2 className="text-lg">share</h2>
        <p className="text-sm dim">
          A 1200×630 PNG card with your active creature, stats, tile count and streak. Drop the URL into a tweet/post and the platform will render it as a preview image.
        </p>
        <div className="flex flex-col gap-2">
          <code className="block break-all bg-bg p-2 text-sm select-all">
            https://codetama.com/u/{session.user.id}/card
          </code>
          <a
            href={`/u/${session.user.id}/card`}
            target="_blank"
            rel="noreferrer"
            className="btn self-start"
          >
            preview card
          </a>
        </div>
      </section>

      <section className="panel space-y-4">
        <h2 className="text-lg text-accent">danger zone</h2>
        <DeleteAccount />
      </section>
    </main>
  );
}
