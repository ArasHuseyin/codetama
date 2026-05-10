"use client";

import { useEffect, useState, useTransition } from "react";

const MAX_TEXT = 80;
const MAX_URL = 200;
const TILE_PREVIEW_TEXT = 16; // chars shown directly on tile

interface TileAdState {
  status: "none" | "draft" | "pending_payment" | "pending_review" | "active" | "rejected" | "refunded";
  text: string | null;
  url: string | null;
  paidAt: string | null;
  rejectReason: string | null;
}

export function TileAd({ ownerName }: { ownerName: string }) {
  const [state, setState] = useState<TileAdState | null>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/tile-ad")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TileAdState | null) => {
        if (!d) return;
        setState(d);
        setText(d.text ?? "");
        setUrl(d.url ?? "");
      })
      .catch(() => {});
  }, []);

  function save(then?: "checkout") {
    setError(null);
    setInfo(null);
    if (!text.trim() && !url.trim()) {
      setError("set text, url, or both");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/tile-ad", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim() || null, url: url.trim() || null }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const d = (await res.json()) as { needsReview: boolean };
      setInfo("saved.");
      if (then === "checkout") {
        const c = await fetch("/api/stripe/checkout", { method: "POST" });
        if (!c.ok) {
          setError(await c.text());
          return;
        }
        const data = (await c.json()) as { url: string };
        window.location.href = data.url;
        return;
      }
      // reload state
      const fresh = await fetch("/api/tile-ad").then((r) => (r.ok ? r.json() : null));
      if (fresh) setState(fresh);
      if (d.needsReview) setInfo("saved — url will need review when you publish.");
    });
  }

  function deactivate() {
    if (!confirm("hide your ad? you can re-activate any time without paying again.")) return;
    startTransition(async () => {
      await fetch("/api/tile-ad", { method: "DELETE" });
      const fresh = await fetch("/api/tile-ad").then((r) => (r.ok ? r.json() : null));
      if (fresh) setState(fresh);
      setInfo("hidden.");
    });
  }

  function reactivate() {
    startTransition(async () => {
      // PUT with current text/url marks status as draft → pending_review or stays active.
      await fetch("/api/tile-ad", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim() || null, url: url.trim() || null }),
      });
      // Then we need to re-publish via checkout? No — already paid once means status should bump back.
      // For MVP: a deactivated paid ad goes back to 'active' on PUT.
      const fresh = await fetch("/api/tile-ad").then((r) => (r.ok ? r.json() : null));
      if (fresh) setState(fresh);
    });
  }

  const isPaid = state && (state.status === "active" || state.status === "pending_review");
  const isDraft = !state || state.status === "none" || state.status === "draft" || state.status === "refunded";

  // Live preview chars shown on tile (truncated)
  const previewText = (text.trim() || "").slice(0, TILE_PREVIEW_TEXT);
  const showStar = !!(text.trim() || url.trim());

  return (
    <section className="panel space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg">tile ad</h2>
        <span className="text-xs muted">€5 · one-time · shows on all your tiles</span>
      </div>

      <p className="text-sm dim">
        Pay once to publish a custom message + url on every tile you own. Examples:{" "}
        <span className="text-fg">&quot;attack me&quot;</span>,{" "}
        <span className="text-fg">&quot;LV 200 here, try me&quot;</span>,{" "}
        <span className="text-fg">github.com/me/coolproject</span>.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-3">
          <label className="block text-xs dim">
            text (max {MAX_TEXT})
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="attack me"
              className="mt-1 w-full bg-bg border border-fgMuted px-3 py-2 text-fg focus:outline-none focus:border-fg"
              disabled={isPending}
            />
            <span className="text-xs muted">{text.length}/{MAX_TEXT}</span>
          </label>

          <label className="block text-xs dim">
            url (optional, max {MAX_URL})
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value.slice(0, MAX_URL))}
              placeholder="github.com/me/project"
              className="mt-1 w-full bg-bg border border-fgMuted px-3 py-2 text-fg focus:outline-none focus:border-fg"
              disabled={isPending}
            />
            <span className="text-xs muted">{url.length}/{MAX_URL} · github.com / *.dev / *.io / *.com…</span>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs dim">live preview:</p>
          <div
            className="border border-fgMuted bg-bgPanel/60 p-3 font-mono text-xs"
            style={{ minHeight: "5.5rem" }}
          >
            <div className="flex justify-between">
              <span className="text-fg">{ownerName.slice(0, 8)}</span>
              {showStar && <span className="text-warn">★</span>}
            </div>
            {previewText && (
              <div className="mt-1 text-fg italic">&quot;{previewText}&quot;</div>
            )}
            <div className="mt-2 text-fgDim">LV ##</div>
            <div className="dim">adult</div>
          </div>
          <p className="text-xs muted">on hover, the full text and url show in a card.</p>
        </div>
      </div>

      {error && <p className="text-accent text-sm">{error}</p>}
      {info && <p className="text-fgDim text-sm">{info}</p>}
      {state?.rejectReason && (
        <p className="text-accent text-sm">rejected: {state.rejectReason}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <>
            <button onClick={() => save()} className="btn" disabled={isPending}>
              {isPending ? "..." : "save draft"}
            </button>
            <button onClick={() => save("checkout")} className="btn" disabled={isPending}>
              {isPending ? "..." : "publish — €5"}
            </button>
          </>
        )}
        {state?.status === "pending_payment" && (
          <p className="text-warn text-sm">awaiting stripe confirmation…</p>
        )}
        {isPaid && (
          <>
            <button onClick={() => save()} className="btn" disabled={isPending}>
              {isPending ? "..." : "update text/url"}
            </button>
            <button onClick={deactivate} className="btn-danger" disabled={isPending}>
              hide ad
            </button>
            {state?.status === "pending_review" && (
              <span className="text-warn text-sm self-center">
                · url awaiting review (~24h)
              </span>
            )}
            {state?.status === "active" && state.paidAt && (
              <span className="text-fgDim text-xs self-center">
                · live since {new Date(state.paidAt).toLocaleDateString()}
              </span>
            )}
          </>
        )}
      </div>
    </section>
  );
}
