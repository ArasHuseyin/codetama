"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./terminal.module.css";
import type { AttackerState, DefenderState } from "./sprites";
import { TRICKSTER_SPRITES, SAGE_SPRITES } from "./BattleSprites";

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

interface LogLine {
  id: number;
  text: string;
}

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
  // INTRO
  { t: 250,  type: "log", text: "> a wild Sage appears" },
  { t: 1100, type: "log", text: "> Trickster wants to fight" },

  // ROUND 1 — Trickster opens
  { t: 2200, type: "log", text: "> Trickster used Shadowstep" },
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

  // ROUND 2 — Sage counters
  { t: 4200, type: "log", text: "> Sage cast Tidewave" },
  { t: 4350, type: "defState", state: "channel" },
  { t: 4750, type: "defState", state: "cast" },
  { t: 4850, type: "particles", who: "attacker", count: 9, kind: "magic" },
  { t: 4950, type: "shake", kind: "mild" },
  { t: 4950, type: "damage", who: "attacker", amount: 24 },
  { t: 4950, type: "attState", state: "hit" },
  { t: 5000, type: "hp", who: "attacker", target: 76 },
  { t: 5400, type: "attState", state: "idle" },
  { t: 5550, type: "defState", state: "idle" },

  // ROUND 3 — Crit
  { t: 6500, type: "log", text: "> Trickster used Flash Strike" },
  { t: 6650, type: "attState", state: "wind_up" },
  { t: 7050, type: "attState", state: "strike" },
  { t: 7050, type: "dash", who: "attacker" },
  { t: 7180, type: "banner", text: "CRITICAL" },
  { t: 7220, type: "shake", kind: "hard" },
  { t: 7220, type: "particles", who: "defender", count: 18, kind: "amber" },
  { t: 7220, type: "damage", who: "defender", amount: 44, crit: true },
  { t: 7220, type: "defState", state: "hit" },
  { t: 7280, type: "hp", who: "defender", target: 28 },
  { t: 7800, type: "attState", state: "idle" },
  { t: 7950, type: "defState", state: "idle" },

  // ROUND 4 — Ultimate
  { t: 8950, type: "banner", text: "ULTIMATE  //  VEIL" },
  { t: 9150, type: "log", text: "> Trickster cast Veil" },
  { t: 9300, type: "attState", state: "wind_up" },
  { t: 9750, type: "flash" },
  { t: 9750, type: "attState", state: "strike" },
  { t: 9820, type: "shake", kind: "hard" },
  { t: 9820, type: "particles", who: "defender", count: 30 },
  { t: 9820, type: "damage", who: "defender", amount: 28 },
  { t: 9820, type: "defState", state: "hit" },
  { t: 9900, type: "hp", who: "defender", target: 0 },
  { t: 10150, type: "defState", state: "dead" },

  // VICTORY
  { t: 10800, type: "banner", text: "TRICKSTER WINS" },
  { t: 11200, type: "attState", state: "victory" },
  { t: 11350, type: "log", text: "> Sage was defeated" },

  { t: 13800, type: "reset" },
];

let particleId = 0;
let damageId = 0;
let logId = 0;

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

  // Reset everything when iter changes (also handles initial mount).
  useEffect(() => {
    setAttState("idle");
    setDefState("idle");
    setAttHp(100);
    setDefHp(100);
    setShake("none");
    setBanner(null);
    setFlash(false);
    setLog([]);
    setParticles([]);
    setDamageNumbers([]);
    setAttDash(false);
    setDefDash(false);
  }, [iter]);

  // Schedule timeline beats.
  useEffect(() => {
    const handles: ReturnType<typeof setTimeout>[] = [];

    for (const beat of TIMELINE) {
      const h = setTimeout(() => {
        switch (beat.type) {
          case "log": {
            const id = ++logId;
            setLog((l) => [...l.slice(-2), { id, text: beat.text }]);
            break;
          }
          case "attState":
            setAttState(beat.state);
            break;
          case "defState":
            setDefState(beat.state);
            break;
          case "shake": {
            setShake(beat.kind);
            const dur = beat.kind === "hard" ? 600 : 400;
            setTimeout(() => setShake("none"), dur);
            break;
          }
          case "flash":
            setFlash(true);
            setTimeout(() => setFlash(false), 240);
            break;
          case "banner": {
            const text = beat.text;
            setBanner(text);
            setTimeout(() => setBanner((cur) => (cur === text ? null : cur)), 1500);
            break;
          }
          case "damage": {
            const id = ++damageId;
            setDamageNumbers((d) => [...d, { id, who: beat.who, value: beat.amount, crit: !!beat.crit }]);
            setTimeout(() => {
              setDamageNumbers((d) => d.filter((x) => x.id !== id));
            }, 950);
            break;
          }
          case "hp":
            if (beat.who === "attacker") setAttHp(beat.target);
            else setDefHp(beat.target);
            break;
          case "particles": {
            const newOnes: Particle[] = [];
            for (let i = 0; i < beat.count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 26 + Math.random() * 70;
              newOnes.push({
                id: ++particleId,
                who: beat.who,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed - 10,
                kind: beat.kind ?? "spark",
              });
            }
            setParticles((p) => [...p, ...newOnes]);
            const ids = new Set(newOnes.map((n) => n.id));
            setTimeout(() => {
              setParticles((p) => p.filter((x) => !ids.has(x.id)));
            }, 750);
            break;
          }
          case "dash":
            if (beat.who === "attacker") {
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
      }, beat.t);
      handles.push(h);
    }

    return () => handles.forEach((h) => clearTimeout(h));
  }, [iter]);

  const shakeClass =
    shake === "mild" ? styles.shakeMild : shake === "hard" ? styles.shakeHard : "";

  return (
    <div className={`${styles.crtFrame} ${shakeClass}`} role="img" aria-label="Battle viewport">
      <span className={styles.cornerTL} aria-hidden />
      <span className={styles.cornerTR} aria-hidden />
      <span className={styles.cornerBL} aria-hidden />
      <span className={styles.cornerBR} aria-hidden />
      <div className={styles.rollingBar} aria-hidden />

      <div className={styles.frameHead}>
        <span>
          <span className={styles.frameHeadDot} aria-hidden />
          BTL://duel.live
        </span>
        <span>round {iter + 1}</span>
      </div>

      {flash && <div className={styles.flash} aria-hidden />}
      {banner && (
        <div className={styles.banner} aria-hidden>
          <span className={styles.bannerText}>{banner}</span>
        </div>
      )}

      <div className={styles.viewport}>
        <div className={`${styles.combatant} ${styles.attacker} ${attDash ? styles.dashAtt : ""}`}>
          <div className={`${styles.label} ${styles.labelAtt}`}>TRICKSTER</div>
          <div className={`${styles.sprite} ${styles.spriteAtt}`}>
            {(() => {
              const C = TRICKSTER_SPRITES[attState];
              return <C />;
            })()}
          </div>
          {damageNumbers
            .filter((d) => d.who === "attacker")
            .map((d) => (
              <span
                key={d.id}
                className={`${styles.damageNum} ${d.crit ? styles.critNum : ""}`}
              >
                −{d.value}
              </span>
            ))}
          {particles
            .filter((p) => p.who === "attacker")
            .map((p) => (
              <span
                key={p.id}
                className={`${styles.particle} ${
                  p.kind === "magic" ? styles.particleMagic : ""
                } ${p.kind === "amber" ? styles.particleAmber : ""}`}
                style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as CSSProperties}
              >
                {p.kind === "magic" ? "✦" : p.kind === "amber" ? "✺" : "✧"}
              </span>
            ))}
        </div>

        <div className={styles.divider} aria-hidden>
          <span className={styles.dividerVs}>vs</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={`${styles.combatant} ${styles.defender} ${defDash ? styles.dashDef : ""}`}>
          <div className={`${styles.label} ${styles.labelDef}`}>SAGE</div>
          <div className={`${styles.sprite} ${styles.spriteDef}`}>
            {(() => {
              const C = SAGE_SPRITES[defState];
              return <C />;
            })()}
          </div>
          {damageNumbers
            .filter((d) => d.who === "defender")
            .map((d) => (
              <span
                key={d.id}
                className={`${styles.damageNum} ${d.crit ? styles.critNum : ""}`}
              >
                −{d.value}
              </span>
            ))}
          {particles
            .filter((p) => p.who === "defender")
            .map((p) => (
              <span
                key={p.id}
                className={`${styles.particle} ${
                  p.kind === "magic" ? styles.particleMagic : ""
                } ${p.kind === "amber" ? styles.particleAmber : ""}`}
                style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as CSSProperties}
              >
                {p.kind === "magic" ? "✦" : p.kind === "amber" ? "✺" : "✧"}
              </span>
            ))}
        </div>
      </div>

      <div className={styles.hpBars}>
        <HpBar label="TRICKSTER" hp={attHp} />
        <HpBar label="SAGE" hp={defHp} />
      </div>

      <div className={styles.battleLog} role="log" aria-live="polite">
        {log.map((l) => (
          <div key={l.id} className={styles.logLine}>
            {l.text}
          </div>
        ))}
      </div>

      <div className={styles.statusBar}>
        <span><span className={styles.statusOk}>OK</span> link.stable</span>
        <span>seed 0x4a7c</span>
        <span>tick {String(iter * 14).padStart(4, "0")}s</span>
        <span>codetama@v0.2.0</span>
      </div>
    </div>
  );
}

function HpBar({ label, hp }: { label: string; hp: number }) {
  const pct = Math.max(0, Math.min(100, hp));
  const tone =
    pct <= 0 ? styles.hpDead : pct > 60 ? styles.hpOk : pct > 25 ? styles.hpWarn : styles.hpCrit;
  return (
    <div className={`${styles.hpBar} ${tone}`}>
      <div className={styles.hpLabel}>
        <span>{label}</span>
        <span className={styles.hpValue}>
          {String(Math.round(hp)).padStart(3, " ")}/100
        </span>
      </div>
      <div className={styles.hpTrack}>
        <div className={styles.hpFill} style={{ width: `${pct}%` }} />
        <div className={styles.hpScan} aria-hidden />
      </div>
    </div>
  );
}
