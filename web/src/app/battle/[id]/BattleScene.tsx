"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  WarriorWire,
  SageWire,
  TricksterWire,
  BalancedWire,
} from "../../preview/sprites/WireframeSprites";
import styles from "./battle.module.css";

const SPRITE_MAP: Record<string, React.ComponentType> = {
  warrior: WarriorWire,
  warlord: WarriorWire,
  sage: SageWire,
  archmage: SageWire,
  trickster: TricksterWire,
  shadow: TricksterWire,
  balanced: BalancedWire,
  druid: BalancedWire,
};

type CombatantState = "idle" | "wind_up" | "strike" | "hit" | "dead" | "victory";

interface Side {
  name: string;
  klass: string | null;
  hp: number;
  maxHp: number;
  isMe: boolean;
  state: CombatantState;
  shake: boolean;
}

interface DamageNum {
  id: number;
  who: "att" | "def";
  value: number;
  crit: boolean;
}
interface ParticleNode {
  id: number;
  who: "att" | "def";
  dx: number;
  dy: number;
  kind: "spark" | "amber";
}

export interface SceneTurn {
  turnNo: number;
  actorUserId: string;
  damage: number;
  heal: number;
  crit: boolean;
  log: string;
  attackerHpAfter: number;
  defenderHpAfter: number;
}

export interface SceneProps {
  attackerId: string;
  attackerName: string;
  attackerKlass: string | null;
  attackerHp: number;
  attackerMaxHp: number;
  attackerIsMe: boolean;
  defenderId: string;
  defenderName: string;
  defenderKlass: string | null;
  defenderHp: number;
  defenderMaxHp: number;
  defenderIsMe: boolean;
  state: "active" | "ended";
  winnerUserId: string | null;
  newTurn: SceneTurn | null;
}

let pId = 0;
let dId = 0;

export function BattleScene(props: SceneProps) {
  const [attState, setAttState] = useState<CombatantState>("idle");
  const [defState, setDefState] = useState<CombatantState>("idle");
  const [shake, setShake] = useState<"none" | "mild" | "hard">("none");
  const [banner, setBanner] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<DamageNum[]>([]);
  const [particles, setParticles] = useState<ParticleNode[]>([]);
  const [attDash, setAttDash] = useState(false);
  const [defDash, setDefDash] = useState(false);

  const handlesRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastTurnNoRef = useRef<number>(-1);

  // End-of-battle final state
  useEffect(() => {
    if (props.state !== "ended") return;
    if (props.winnerUserId === props.attackerId) {
      setAttState("victory");
      setDefState("dead");
    } else if (props.winnerUserId === props.defenderId) {
      setAttState("dead");
      setDefState("victory");
    }
  }, [props.state, props.winnerUserId, props.attackerId, props.defenderId]);

  // Animate new turns
  useEffect(() => {
    const turn = props.newTurn;
    if (!turn) return;
    if (turn.turnNo <= lastTurnNoRef.current) return;
    lastTurnNoRef.current = turn.turnNo;

    handlesRef.current.forEach((h) => clearTimeout(h));
    handlesRef.current = [];

    const isAttackerActor = turn.actorUserId === props.attackerId;
    const big = turn.damage >= 35 || turn.crit;
    const sched = (ms: number, fn: () => void) => {
      handlesRef.current.push(setTimeout(fn, ms));
    };

    // 0ms : wind-up
    if (isAttackerActor) {
      setAttState("wind_up");
    } else {
      setDefState("wind_up");
    }

    // 350ms : strike + dash
    sched(350, () => {
      if (isAttackerActor) {
        setAttState("strike");
        setAttDash(true);
        sched(420, () => setAttDash(false));
      } else {
        setDefState("strike");
        setDefDash(true);
        sched(420, () => setDefDash(false));
      }
    });

    // 480ms : impact
    sched(480, () => {
      if (turn.damage > 0) {
        // damage number on target
        const dnId = ++dId;
        const targetSide = isAttackerActor ? "def" : "att";
        setDamageNumbers((d) => [
          ...d,
          { id: dnId, who: targetSide, value: turn.damage, crit: turn.crit },
        ]);
        sched(950, () =>
          setDamageNumbers((d) => d.filter((x) => x.id !== dnId)),
        );

        // particles
        const newOnes: ParticleNode[] = [];
        const count = turn.crit ? 18 : big ? 12 : 7;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 26 + Math.random() * 70;
          newOnes.push({
            id: ++pId,
            who: targetSide,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed - 10,
            kind: turn.crit ? "amber" : "spark",
          });
        }
        setParticles((p) => [...p, ...newOnes]);
        const ids = new Set(newOnes.map((n) => n.id));
        sched(800, () => setParticles((p) => p.filter((x) => !ids.has(x.id))));

        // shake
        setShake(turn.crit ? "hard" : "mild");
        sched(turn.crit ? 600 : 400, () => setShake("none"));

        // banner for big hits
        if (turn.crit) {
          setBanner("CRITICAL");
          sched(1500, () => setBanner((cur) => (cur === "CRITICAL" ? null : cur)));
        }

        // hit state on target
        if (isAttackerActor) {
          setDefState("hit");
        } else {
          setAttState("hit");
        }
      } else if (turn.heal > 0) {
        // heal — small green particles on actor
        const newOnes: ParticleNode[] = [];
        for (let i = 0; i < 7; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 24 + Math.random() * 50;
          newOnes.push({
            id: ++pId,
            who: isAttackerActor ? "att" : "def",
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed - 30,
            kind: "spark",
          });
        }
        setParticles((p) => [...p, ...newOnes]);
        const ids = new Set(newOnes.map((n) => n.id));
        sched(800, () => setParticles((p) => p.filter((x) => !ids.has(x.id))));
      }
    });

    // 1100ms : recovery to idle (unless ending)
    sched(1100, () => {
      if (props.state === "ended") return;
      setAttState("idle");
      setDefState("idle");
    });

    return () => {
      handlesRef.current.forEach((h) => clearTimeout(h));
    };
  }, [props.newTurn, props.attackerId, props.state]);

  return (
    <div className={`${styles.scene} ${shakeClass(shake)}`}>
      {flash && <div className={styles.flash} aria-hidden />}
      {banner && (
        <div className={styles.banner} aria-hidden>
          <span className={styles.bannerText}>{banner}</span>
        </div>
      )}

      <Combatant
        side="att"
        name={props.attackerName}
        klass={props.attackerKlass}
        hp={props.attackerHp}
        maxHp={props.attackerMaxHp}
        isMe={props.attackerIsMe}
        state={attState}
        dashing={attDash}
        damageNumbers={damageNumbers.filter((d) => d.who === "att")}
        particles={particles.filter((p) => p.who === "att")}
      />

      <div className={styles.divider} aria-hidden>
        <span>vs</span>
      </div>

      <Combatant
        side="def"
        name={props.defenderName}
        klass={props.defenderKlass}
        hp={props.defenderHp}
        maxHp={props.defenderMaxHp}
        isMe={props.defenderIsMe}
        state={defState}
        dashing={defDash}
        damageNumbers={damageNumbers.filter((d) => d.who === "def")}
        particles={particles.filter((p) => p.who === "def")}
      />
    </div>
  );
}

function Combatant({
  side,
  name,
  klass,
  hp,
  maxHp,
  isMe,
  state,
  dashing,
  damageNumbers,
  particles,
}: {
  side: "att" | "def";
  name: string;
  klass: string | null;
  hp: number;
  maxHp: number;
  isMe: boolean;
  state: CombatantState;
  dashing: boolean;
  damageNumbers: DamageNum[];
  particles: ParticleNode[];
}) {
  const Sprite = (klass && SPRITE_MAP[klass]) || BalancedWire;
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  const tone =
    pct <= 0
      ? styles.hpDead
      : pct > 60
        ? styles.hpOk
        : pct > 25
          ? styles.hpWarn
          : styles.hpCrit;

  return (
    <div className={`${styles.combatant} ${styles[`combatant_${side}`] ?? ""}`}>
      <div className={styles.label}>
        <span className={isMe ? styles.labelSelf : styles.labelEnemy}>
          {isMe ? "YOU" : name}
        </span>
        <span className={styles.hpVal}>
          {Math.max(0, Math.round(hp))} / {maxHp}
        </span>
      </div>
      <div className={styles.hpTrack}>
        <div className={`${styles.hpFill} ${tone}`} style={{ width: `${pct}%` }} />
      </div>

      <div
        className={`${styles.spriteHost} ${styles[`state_${state}`] ?? ""} ${
          dashing ? (side === "att" ? styles.dashRight : styles.dashLeft) : ""
        }`}
      >
        <Sprite />
        {damageNumbers.map((d) => (
          <span
            key={d.id}
            className={`${styles.damageNum} ${d.crit ? styles.critNum : ""}`}
          >
            −{d.value}
          </span>
        ))}
        {particles.map((p) => (
          <span
            key={p.id}
            className={`${styles.particle} ${p.kind === "amber" ? styles.particleAmber : ""}`}
            style={
              { "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as CSSProperties
            }
            aria-hidden
          />
        ))}
      </div>

      <div className={styles.subLabel}>{name} · {klass ?? "—"}</div>
    </div>
  );
}

function shakeClass(s: "none" | "mild" | "hard"): string {
  if (s === "mild") return styles.shakeMild ?? "";
  if (s === "hard") return styles.shakeHard ?? "";
  return "";
}
