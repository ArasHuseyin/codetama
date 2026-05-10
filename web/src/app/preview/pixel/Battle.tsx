"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./pixel.module.css";
import {
  TRICKSTER,
  SAGE,
  type AttackerState,
  type DefenderState,
} from "../terminal/sprites";

interface Particle {
  id: number;
  who: "attacker" | "defender";
  dx: number;
  dy: number;
  kind: "spark" | "magic" | "amber";
}
interface DamageNum {
  id: number;
  who: "attacker" | "defender";
  value: number;
  crit: boolean;
}
interface LogLine { id: number; text: string }

type Beat =
  | { t: number; type: "log"; text: string }
  | { t: number; type: "attState"; state: AttackerState }
  | { t: number; type: "defState"; state: DefenderState }
  | { t: number; type: "shake"; kind: "mild" | "hard" }
  | { t: number; type: "flash" }
  | { t: number; type: "banner"; text: string }
  | { t: number; type: "damage"; who: "attacker" | "defender"; amount: number; crit?: boolean }
  | { t: number; type: "hp"; who: "attacker" | "defender"; target: number }
  | { t: number; type: "particles"; who: "attacker" | "defender"; count: number; kind?: Particle["kind"] }
  | { t: number; type: "dash"; who: "attacker" | "defender" }
  | { t: number; type: "reset" };

const TIMELINE: Beat[] = [
  { t: 250,  type: "log", text: "A wild SAGE appeared!" },
  { t: 1100, type: "log", text: "Go! TRICKSTER!" },
  { t: 2200, type: "log", text: "TRICKSTER used SHADOWSTEP!" },
  { t: 2350, type: "attState", state: "wind_up" },
  { t: 2750, type: "attState", state: "strike" },
  { t: 2750, type: "dash", who: "attacker" },
  { t: 2900, type: "shake", kind: "mild" },
  { t: 2900, type: "particles", who: "defender", count: 7 },
  { t: 2900, type: "damage", who: "defender", amount: 28 },
  { t: 2900, type: "defState", state: "hit" },
  { t: 2950, type: "hp", who: "defender", target: 72 },
  { t: 3300, type: "attState", state: "idle" },
  { t: 3450, type: "defState", state: "idle" },
  { t: 4200, type: "log", text: "SAGE used TIDEWAVE!" },
  { t: 4350, type: "defState", state: "channel" },
  { t: 4750, type: "defState", state: "cast" },
  { t: 4850, type: "particles", who: "attacker", count: 9, kind: "magic" },
  { t: 4950, type: "shake", kind: "mild" },
  { t: 4950, type: "damage", who: "attacker", amount: 24 },
  { t: 4950, type: "attState", state: "hit" },
  { t: 5000, type: "hp", who: "attacker", target: 76 },
  { t: 5400, type: "attState", state: "idle" },
  { t: 5550, type: "defState", state: "idle" },
  { t: 6500, type: "log", text: "TRICKSTER used FLASH STRIKE!" },
  { t: 6650, type: "attState", state: "wind_up" },
  { t: 7050, type: "attState", state: "strike" },
  { t: 7050, type: "dash", who: "attacker" },
  { t: 7180, type: "banner", text: "CRITICAL!" },
  { t: 7220, type: "shake", kind: "hard" },
  { t: 7220, type: "particles", who: "defender", count: 18, kind: "amber" },
  { t: 7220, type: "damage", who: "defender", amount: 44, crit: true },
  { t: 7220, type: "defState", state: "hit" },
  { t: 7280, type: "hp", who: "defender", target: 28 },
  { t: 7800, type: "attState", state: "idle" },
  { t: 7950, type: "defState", state: "idle" },
  { t: 8950, type: "banner", text: "VEIL!" },
  { t: 9150, type: "log", text: "ULTIMATE: VEIL!" },
  { t: 9300, type: "attState", state: "wind_up" },
  { t: 9750, type: "flash" },
  { t: 9750, type: "attState", state: "strike" },
  { t: 9820, type: "shake", kind: "hard" },
  { t: 9820, type: "particles", who: "defender", count: 30 },
  { t: 9820, type: "damage", who: "defender", amount: 28 },
  { t: 9820, type: "defState", state: "hit" },
  { t: 9900, type: "hp", who: "defender", target: 0 },
  { t: 10150, type: "defState", state: "dead" },
  { t: 10800, type: "banner", text: "WIN!" },
  { t: 11200, type: "attState", state: "victory" },
  { t: 11350, type: "log", text: "SAGE was defeated!" },
  { t: 13800, type: "reset" },
];

let pId = 0;
let dId = 0;
let lId = 0;

export function Battle() {
  const [iter, setIter] = useState(0);
  const [attState, setAttState] = useState<AttackerState>("idle");
  const [defState, setDefState] = useState<DefenderState>("idle");
  const [attHp, setAttHp] = useState(100);
  const [defHp, setDefHp] = useState(100);
  const [shake, setShake] = useState<"none" | "mild" | "hard">("none");
  const [banner, setBanner] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNum[]>([]);
  const [attDash, setAttDash] = useState(false);
  const [defDash, setDefDash] = useState(false);

  useEffect(() => {
    setAttState("idle"); setDefState("idle");
    setAttHp(100); setDefHp(100);
    setShake("none"); setBanner(null); setFlash(false);
    setLog([]); setParticles([]); setDamageNumbers([]);
    setAttDash(false); setDefDash(false);
  }, [iter]);

  useEffect(() => {
    const handles: ReturnType<typeof setTimeout>[] = [];
    for (const b of TIMELINE) {
      const h = setTimeout(() => {
        switch (b.type) {
          case "log": {
            const id = ++lId;
            setLog((l) => [...l.slice(-2), { id, text: b.text }]);
            break;
          }
          case "attState": setAttState(b.state); break;
          case "defState": setDefState(b.state); break;
          case "shake": {
            setShake(b.kind);
            setTimeout(() => setShake("none"), b.kind === "hard" ? 600 : 400);
            break;
          }
          case "flash":
            setFlash(true);
            setTimeout(() => setFlash(false), 240);
            break;
          case "banner": {
            const text = b.text;
            setBanner(text);
            setTimeout(() => setBanner((cur) => (cur === text ? null : cur)), 1500);
            break;
          }
          case "damage": {
            const id = ++dId;
            setDamageNumbers((d) => [...d, { id, who: b.who, value: b.amount, crit: !!b.crit }]);
            setTimeout(() => {
              setDamageNumbers((d) => d.filter((x) => x.id !== id));
            }, 950);
            break;
          }
          case "hp":
            if (b.who === "attacker") setAttHp(b.target);
            else setDefHp(b.target);
            break;
          case "particles": {
            const newOnes: Particle[] = [];
            for (let i = 0; i < b.count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 26 + Math.random() * 70;
              newOnes.push({
                id: ++pId,
                who: b.who,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed - 10,
                kind: b.kind ?? "spark",
              });
            }
            setParticles((p) => [...p, ...newOnes]);
            const ids = new Set(newOnes.map((n) => n.id));
            setTimeout(() => {
              setParticles((p) => p.filter((x) => !ids.has(x.id)));
            }, 800);
            break;
          }
          case "dash":
            if (b.who === "attacker") {
              setAttDash(true);
              setTimeout(() => setAttDash(false), 420);
            } else {
              setDefDash(true);
              setTimeout(() => setDefDash(false), 420);
            }
            break;
          case "reset":
            setIter((i) => i + 1);
            break;
        }
      }, b.t);
      handles.push(h);
    }
    return () => handles.forEach((h) => clearTimeout(h));
  }, [iter]);

  const shakeClass =
    shake === "mild" ? styles.shakeMild : shake === "hard" ? styles.shakeHard : "";

  return (
    <>
      <div className={`${styles.battleWindow} ${shakeClass}`}>
        <div className={styles.battleHeader}>
          <span>BATTLE</span>
          <span>RND {iter + 1}</span>
        </div>

        {flash && <div className={styles.flash} aria-hidden />}
        {banner && (
          <div className={styles.banner} aria-hidden>
            <span className={styles.bannerText}>{banner}</span>
          </div>
        )}

        <div className={styles.scene}>
          <span className={`${styles.platform} ${styles.platformAtt}`} aria-hidden />
          <span className={`${styles.platform} ${styles.platformDef}`} aria-hidden />

          <div className={`${styles.combatant} ${styles.attacker} ${attDash ? styles.dashAtt : ""}`}>
            <pre className={styles.sprite}>{TRICKSTER[attState]}</pre>
            <div className={styles.label}>TRICKSTER</div>
            {damageNumbers.filter((d) => d.who === "attacker").map((d) => (
              <span key={d.id} className={`${styles.damageNum} ${d.crit ? styles.critNum : ""}`}>
                −{d.value}
              </span>
            ))}
            {particles.filter((p) => p.who === "attacker").map((p) => (
              <span
                key={p.id}
                className={`${styles.particle} ${
                  p.kind === "magic" ? styles.particleMagic : ""
                } ${p.kind === "amber" ? styles.particleAmber : ""}`}
                style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as CSSProperties}
                aria-hidden
              />
            ))}
          </div>

          <div className={`${styles.combatant} ${styles.defender} ${defDash ? styles.dashDef : ""}`}>
            <div className={styles.label}>SAGE</div>
            <pre className={styles.sprite}>{SAGE[defState]}</pre>
            {damageNumbers.filter((d) => d.who === "defender").map((d) => (
              <span key={d.id} className={`${styles.damageNum} ${d.crit ? styles.critNum : ""}`}>
                −{d.value}
              </span>
            ))}
            {particles.filter((p) => p.who === "defender").map((p) => (
              <span
                key={p.id}
                className={`${styles.particle} ${
                  p.kind === "magic" ? styles.particleMagic : ""
                } ${p.kind === "amber" ? styles.particleAmber : ""}`}
                style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as CSSProperties}
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.hpBars}>
        <HpBar label="TRICKSTER" hp={attHp} />
        <HpBar label="SAGE" hp={defHp} />
      </div>

      <div className={styles.dialog} role="log" aria-live="polite">
        {log.map((l) => (
          <div key={l.id} className={styles.logLine}>{l.text}</div>
        ))}
      </div>
    </>
  );
}

function HpBar({ label, hp }: { label: string; hp: number }) {
  const pct = Math.max(0, Math.min(100, hp));
  const tone =
    pct <= 0 ? styles.hpDead : pct > 60 ? styles.hpOk : pct > 25 ? styles.hpWarn : styles.hpCrit;
  return (
    <div className={styles.hpBar}>
      <div className={styles.hpHead}>
        <span className={styles.hpName}>{label}</span>
        <span className={styles.hpVal}>{Math.round(hp).toString().padStart(3, "0")}/100</span>
      </div>
      <div className={styles.hpTrack}>
        <div className={`${styles.hpFill} ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
