"use client";

import { useState, useTransition } from "react";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    if (phrase.trim().toLowerCase() !== "delete my account") {
      setError(`type "delete my account" to confirm`);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        setError(await res.text().catch(() => "delete failed"));
        return;
      }
      window.location.href = "/";
    });
  }

  if (!confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm dim">
          Permanently delete your account, all creatures, tiles, battle history, and CLI tokens. Cannot be undone.
        </p>
        <button onClick={() => setConfirming(true)} className="btn-danger">
          delete account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border border-warn/60 bg-warn/5 p-3">
      <p className="text-warn text-sm">
        ⚠ this is irreversible. type <code className="text-fg">delete my account</code> below to confirm.
      </p>
      <input
        type="text"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        placeholder="delete my account"
        className="w-full bg-bg border border-fgMuted px-3 py-2 text-fg focus:outline-none focus:border-fg"
        disabled={isPending}
      />
      {error && <p className="text-accent text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={go} className="btn-danger" disabled={isPending}>
          {isPending ? "deleting…" : "confirm delete"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setPhrase("");
            setError(null);
          }}
          className="btn"
          disabled={isPending}
        >
          cancel
        </button>
      </div>
    </div>
  );
}
