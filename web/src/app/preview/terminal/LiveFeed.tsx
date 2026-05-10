"use client";

import { useEffect, useState } from "react";
import styles from "./terminal.module.css";

type EventKind = "conn" | "btl" | "evo" | "tile" | "die";

interface FeedEvent {
  id: number;
  kind: EventKind;
  text: string;
  bornAt: number;
}

const NAMES = [
  "plucky_janet", "grumpy_bork", "snappy_pip", "wibbly_ziggy",
  "cosmic_tofu", "tiny_gizmo", "mighty_mochi", "sneaky_bean",
  "brave_pickle", "curious_noodle",
];
const CLASSES = ["Warrior", "Sage", "Trickster", "Druid", "Warlord", "Archmage", "Shadow"];
const STAGES = ["Egg", "Baby", "Adult", "Elder"];

function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)] as T;
}

function tile(): string {
  const x = Math.floor(Math.random() * 23) - 11;
  const y = Math.floor(Math.random() * 23) - 11;
  return `(${x},${y})`;
}

function generate(id: number, now: number): FeedEvent {
  const r = Math.random();
  if (r < 0.22) return { id, kind: "conn", text: `@${pick(NAMES)} joined`, bornAt: now };
  if (r < 0.5) return { id, kind: "btl", text: `@${pick(NAMES)} defeated @${pick(NAMES)}`, bornAt: now };
  if (r < 0.72) return { id, kind: "evo", text: `@${pick(NAMES)} → ${pick(CLASSES)}`, bornAt: now };
  if (r < 0.92) return { id, kind: "tile", text: `${tile()} captured by @${pick(NAMES)}`, bornAt: now };
  return { id, kind: "die", text: `@${pick(NAMES)} starved at ${pick(STAGES)}`, bornAt: now };
}

function relTime(then: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// Offsets are stable; bornAt is computed at mount time so SSR and CSR
// render identical empty state, then the client populates the feed.
const SEED_OFFSETS: Array<{ id: number; kind: EventKind; text: string; offsetMs: number }> = [
  { id: -1, kind: "evo",  text: "@plucky_janet → Sage",              offsetMs: 6_000 },
  { id: -2, kind: "btl",  text: "@grumpy_bork defeated @snappy_pip", offsetMs: 132_000 },
  { id: -3, kind: "conn", text: "@cosmic_tofu joined",                offsetMs: 245_000 },
  { id: -4, kind: "tile", text: "(3,-1) captured by @wibbly_ziggy",   offsetMs: 412_000 },
  { id: -5, kind: "die",  text: "@sneaky_bean starved at Adult",      offsetMs: 783_000 },
  { id: -6, kind: "evo",  text: "@mighty_mochi → Warlord",            offsetMs: 1_240_000 },
];

let nextId = 0;

export function LiveFeed() {
  // Start empty on the server; populate on mount to avoid hydration mismatch.
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [now, setNow] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setEvents(SEED_OFFSETS.map((s) => ({ id: s.id, kind: s.kind, text: s.text, bornAt: t - s.offsetMs })));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = 3800 + Math.random() * 3500;
      timer = setTimeout(() => {
        setEvents((prev) => {
          const next = generate(++nextId, Date.now());
          return [next, ...prev].slice(0, 6);
        });
        schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handle = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(handle);
  }, [mounted]);

  return (
    <div className={styles.liveFeed} aria-label="Live activity feed">
      <div className={styles.liveFeedHead}>
        <span className={styles.liveFeedHeadDot} aria-hidden />
        <span className={styles.liveFeedHeadTitle}>LIVE FEED</span>
        <span className={styles.liveFeedHeadMeta}>// streaming</span>
      </div>
      <div className={styles.liveFeedBody}>
        {events.map((e) => (
          <div
            key={e.id}
            className={`${styles.feedRow} ${kindClass(e.kind)}`}
          >
            <span className={styles.feedTag}>[{e.kind.padEnd(4, " ")}]</span>
            <span className={styles.feedText}>{e.text}</span>
            <span className={styles.feedTime}>{relTime(e.bornAt, now)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function kindClass(k: EventKind): string {
  switch (k) {
    case "conn": return styles.feedKindConn ?? "";
    case "btl":  return styles.feedKindBtl ?? "";
    case "evo":  return styles.feedKindEvo ?? "";
    case "tile": return styles.feedKindTile ?? "";
    case "die":  return styles.feedKindDie ?? "";
  }
}
