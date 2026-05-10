"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BattleScene, type SceneTurn } from "./BattleScene";

interface SkillView {
  id: string;
  name: string;
  cooldown: number;
  description: string;
  ultimate: boolean;
  remainingCd: number;
}

interface ParticipantView {
  userId: string;
  username: string | null;
  image: string | null;
  creatureId: string;
  creatureName: string;
  klass: string | null;
  hp: number;
  maxHp: number;
  cooldowns: Record<string, number>;
  skills: SkillView[];
}

interface TurnView {
  turnNo: number;
  actorUserId: string;
  skillId: string;
  damage: number;
  heal: number;
  crit: boolean;
  log: string;
  attackerHpAfter: number;
  defenderHpAfter: number;
}

interface BattleSnapshot {
  id: string;
  state: "active" | "ended";
  turnNo: number;
  turnOwnerUserId: string | null;
  startedAt: string;
  endedAt: string | null;
  winnerUserId: string | null;
  attacker: ParticipantView;
  defender: ParticipantView;
  log: TurnView[];
}

const POLL_MS = 1500;

export function BattleView({
  battleId,
  initial,
  viewerId,
}: {
  battleId: string;
  initial: BattleSnapshot;
  viewerId: string;
}) {
  const [snap, setSnap] = useState<BattleSnapshot>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (snap.state === "ended") return;
    const handle = setInterval(() => {
      fetch(`/api/battle/${battleId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: BattleSnapshot | null) => {
          if (data) setSnap(data);
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(handle);
  }, [battleId, snap.state]);

  const me = snap.attacker.userId === viewerId ? snap.attacker : snap.defender;
  const them = snap.attacker.userId === viewerId ? snap.defender : snap.attacker;
  const myTurn = snap.state === "active" && snap.turnOwnerUserId === viewerId;

  // Hand the most recent turn to the scene; it tracks turnNo internally and
  // only animates new ones.
  const latestTurn = useMemo<SceneTurn | null>(() => {
    if (snap.log.length === 0) return null;
    const t = snap.log[snap.log.length - 1]!;
    return {
      turnNo: t.turnNo,
      actorUserId: t.actorUserId,
      damage: t.damage,
      heal: t.heal,
      crit: t.crit,
      log: t.log,
      attackerHpAfter: t.attackerHpAfter,
      defenderHpAfter: t.defenderHpAfter,
    };
  }, [snap.log]);

  function useSkill(skillId: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/battle/${battleId}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const refreshed = await fetch(`/api/battle/${battleId}`).then((r) => r.json() as Promise<BattleSnapshot>);
      setSnap(refreshed);
    });
  }

  return (
    <main className="space-y-6">
      <header className="flex justify-between items-baseline">
        <div>
          <p className="dim text-sm">/battle/{battleId.slice(0, 8)}</p>
          <h1 className="text-2xl mt-1">
            {snap.attacker.username ?? "anon"} vs {snap.defender.username ?? "anon"}
          </h1>
        </div>
        <div className="text-sm dim">
          turn {snap.turnNo}
          {snap.state === "ended" ? (
            <span className="ml-2 text-fg">
              · winner: {snap.winnerUserId === viewerId ? "you" : "opponent"}
            </span>
          ) : myTurn ? (
            <span className="ml-2 text-warn blink">· your move</span>
          ) : (
            <span className="ml-2 dim">· waiting…</span>
          )}
        </div>
      </header>

      <BattleScene
        attackerId={snap.attacker.userId}
        attackerName={snap.attacker.creatureName}
        attackerKlass={snap.attacker.klass}
        attackerHp={snap.attacker.hp}
        attackerMaxHp={snap.attacker.maxHp}
        attackerIsMe={snap.attacker.userId === viewerId}
        defenderId={snap.defender.userId}
        defenderName={snap.defender.creatureName}
        defenderKlass={snap.defender.klass}
        defenderHp={snap.defender.hp}
        defenderMaxHp={snap.defender.maxHp}
        defenderIsMe={snap.defender.userId === viewerId}
        state={snap.state}
        winnerUserId={snap.winnerUserId}
        newTurn={latestTurn}
      />
      <section className="grid md:grid-cols-2 gap-4">
        <CombatantPanel p={them} accent="enemy" />
        <CombatantPanel p={me} accent="self" />
      </section>

      {snap.state === "active" && (
        <section className="panel space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg">{myTurn ? "pick your move" : "opponent is choosing"}</h2>
            {error && <span className="text-accent text-sm">{error}</span>}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {me.skills.map((s) => (
              <button
                key={s.id}
                disabled={!myTurn || s.remainingCd > 0 || isPending}
                onClick={() => useSkill(s.id)}
                className={`text-left border p-3 transition ${
                  myTurn && s.remainingCd === 0
                    ? "border-fg/60 hover:bg-fg hover:text-bg"
                    : "border-fgMuted opacity-50 cursor-not-allowed"
                } ${s.ultimate ? "border-warn/60" : ""}`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{s.name}{s.ultimate ? " ★" : ""}</span>
                  <span className="text-xs dim">
                    {s.remainingCd > 0 ? `cd ${s.remainingCd}` : s.cooldown > 0 ? `cd ${s.cooldown}` : "ready"}
                  </span>
                </div>
                <p className="text-xs muted mt-1">{s.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {snap.state === "ended" && (
        <section className="panel-tight">
          <Link href="/map" className="btn">← back to map</Link>
        </section>
      )}

      <section className="panel space-y-1 max-h-64 overflow-y-auto">
        <h3 className="text-sm dim mb-2">battle log</h3>
        {snap.log.length === 0 && <p className="muted text-xs">no moves yet — defender goes first.</p>}
        {snap.log.slice().reverse().map((t) => (
          <p key={t.turnNo} className="text-sm">
            <span className="dim">[{t.turnNo}]</span>{" "}
            {t.crit && <span className="text-warn">CRIT </span>}
            {t.log}
          </p>
        ))}
      </section>
    </main>
  );
}

function CombatantPanel({ p, accent }: { p: ParticipantView; accent: "self" | "enemy" }) {
  const pct = (p.hp / Math.max(1, p.maxHp)) * 100;
  const barColor = accent === "self" ? "bg-fg" : "bg-accent";
  return (
    <div className="panel space-y-2">
      <div className="flex justify-between items-baseline">
        <div>
          <p className="text-fg font-bold">{p.creatureName}</p>
          <p className="text-xs dim">@{p.username ?? "anon"} · {p.klass ?? "—"}</p>
        </div>
        <p className="text-sm dim">HP <span className="text-fg">{p.hp}</span> / {p.maxHp}</p>
      </div>
      <div className="h-2 bg-bg border border-fgMuted relative overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
