"use client";

import { useState, useTransition } from "react";

export interface TokenView {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

export function TokenManager({ existing }: { existing: TokenView[] }) {
  const [tokens, setTokens] = useState(existing);
  const [name, setName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    if (!name.trim()) {
      setError("give your token a name first");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const data = (await res.json()) as { token: string; record: TokenView };
      setJustCreated(data.token);
      setTokens([data.record, ...tokens]);
      setName("");
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setTokens(tokens.map((t) => (t.id === id ? { ...t, revoked: true } : t)));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="token name (e.g. laptop, work-machine)"
          className="flex-1 bg-bg border border-fgMuted px-3 py-2 text-fg focus:outline-none focus:border-fg"
          disabled={isPending}
        />
        <button onClick={create} className="btn" disabled={isPending}>
          {isPending ? "..." : "generate"}
        </button>
      </div>
      {error && <p className="text-accent text-sm">{error}</p>}

      {justCreated && (
        <div className="border border-warn/60 bg-warn/5 p-3 space-y-2">
          <p className="text-warn text-sm">
            ⚠ copy this now — it won't be shown again
          </p>
          <code className="block break-all bg-bg p-2 text-fg select-all">{justCreated}</code>
          <button
            className="text-xs dim hover:text-fg"
            onClick={() => navigator.clipboard.writeText(justCreated)}
          >
            copy to clipboard
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="dim">
          <tr>
            <th className="text-left py-2">name</th>
            <th className="text-left py-2">prefix</th>
            <th className="text-left py-2">last used</th>
            <th className="text-right py-2"></th>
          </tr>
        </thead>
        <tbody>
          {tokens.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 muted text-center">
                no tokens yet — generate one to use the CLI in multiplayer mode
              </td>
            </tr>
          )}
          {tokens.map((t) => (
            <tr key={t.id} className="border-t border-fgMuted">
              <td className="py-2 text-fg">{t.name}</td>
              <td className="py-2 dim">{t.prefix}…</td>
              <td className="py-2 dim">
                {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "never"}
              </td>
              <td className="py-2 text-right">
                {t.revoked ? (
                  <span className="muted text-xs">revoked</span>
                ) : (
                  <button onClick={() => revoke(t.id)} className="btn-danger" disabled={isPending}>
                    revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
