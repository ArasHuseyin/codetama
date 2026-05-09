import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listTokens } from "@/lib/tokens";
import { TokenManager } from "./TokenManager";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tokens = await listTokens(session.user.id);
  const sorted = tokens
    .slice()
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  return (
    <main className="space-y-10">
      <header className="space-y-2">
        <p className="dim text-sm">/profile</p>
        <h1 className="text-3xl">{session.user.name ?? "anonymous"}</h1>
        <p className="text-sm dim">{session.user.email}</p>
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
    </main>
  );
}
