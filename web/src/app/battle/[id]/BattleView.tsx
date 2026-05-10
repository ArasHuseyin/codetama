"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BattleScene, type SceneTurn } from "./BattleScene";

interface ParticipantView {
  userId: string;
  username: string | null;
  image: string | null;
  creatureId: string;
  creatureName: string;
  klass: string | null;
  hp: number;
  maxHp: number;
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
  attacker: ParticipantView & { skills: unknown[] };
  defender: ParticipantView & { skills: unknown[] };
  log: TurnView[];
}

const PLAYBACK_INTERVAL_MS = 1500;

export function BattleView({
  battleId,
  initial,
  viewerId,
}: {
  battleId: string;
  initial: BattleSnapshot;
  viewerId: string;
}) {
  const snap = initial;
  const [playbackIdx, setPlaybackIdx] = useState(-1);

  // Step through the log one turn at a time, animating each.
  useEffect(() => {
    if (snap.log.length === 0) return;
    if (playbackIdx === -1) {
      const start = setTimeout(() => setPlaybackIdx(0), 600);
      return () => clearTimeout(start);
    }
    if (playbackIdx >= snap.log.length) return;
    const handle = setTimeout(() => {
      setPlaybackIdx((idx) => idx + 1);
    }, PLAYBACK_INTERVAL_MS);
    return () => clearTimeout(handle);
  }, [playbackIdx, snap.log.length]);

  const playbackDone = playbackIdx >= snap.log.length;

  // Current turn being shown to the scene.
  const currentTurn = useMemo<SceneTurn | null>(() => {
    if (playbackIdx < 0 || playbackIdx >= snap.log.length) return null;
    const t = snap.log[playbackIdx]!;
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
  }, [playbackIdx, snap.log]);

  // Visible HP follows the most recently animated turn.
  const lastShown = playbackIdx < 0 ? -1 : Math.min(playbackIdx, snap.log.length - 1);
  const attHp =
    lastShown >= 0 ? snap.log[lastShown]!.attackerHpAfter : snap.attacker.maxHp;
  const defHp =
    lastShown >= 0 ? snap.log[lastShown]!.defenderHpAfter : snap.defender.maxHp;

  const playbackEnded = playbackDone && snap.state === "ended";
  const youWon = snap.winnerUserId === viewerId;

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
          {playbackEnded ? (
            <span className={youWon ? "text-fg" : "text-accent"}>
              · {youWon ? "victory" : "defeated"}
            </span>
          ) : (
            <span className="text-fg blink">· auto-battle in progress</span>
          )}
        </div>
      </header>

      <BattleScene
        attackerId={snap.attacker.userId}
        attackerName={snap.attacker.creatureName}
        attackerKlass={snap.attacker.klass}
        attackerHp={attHp}
        attackerMaxHp={snap.attacker.maxHp}
        attackerIsMe={snap.attacker.userId === viewerId}
        defenderId={snap.defender.userId}
        defenderName={snap.defender.creatureName}
        defenderKlass={snap.defender.klass}
        defenderHp={defHp}
        defenderMaxHp={snap.defender.maxHp}
        defenderIsMe={snap.defender.userId === viewerId}
        state={playbackEnded ? "ended" : "active"}
        winnerUserId={playbackEnded ? snap.winnerUserId : null}
        newTurn={currentTurn}
      />

      {playbackEnded && (
        <section className="panel-tight flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm">
            {youWon ? (
              <>
                <span className="text-fg font-bold">victory.</span>{" "}
                <span className="dim">tile captured if it was a challenge.</span>
              </>
            ) : (
              <>
                <span className="text-accent font-bold">defeated.</span>{" "}
                <span className="dim">come back stronger.</span>
              </>
            )}
          </div>
          <Link href="/map" className="btn">← back to map</Link>
        </section>
      )}

      <section className="panel space-y-1 max-h-64 overflow-y-auto">
        <h3 className="text-sm dim mb-2">battle log</h3>
        {snap.log.length === 0 && <p className="muted text-xs">no moves recorded.</p>}
        {snap.log.slice(0, lastShown + 1).reverse().map((t) => (
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
