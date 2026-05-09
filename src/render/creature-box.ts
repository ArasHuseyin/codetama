import { moodOf } from "../core/hunger.js";
import { rankedPaths } from "../core/classes.js";
import { activeCreature } from "../core/state.js";
import {
  STAGE_THRESHOLDS,
  TREND_VISIBLE_FROM_PROMPT,
  level,
  maxHp,
  type Creature,
  type State,
} from "../types.js";
import { artFor, classDisplayName, stageDisplayName } from "./art.js";

const BOX_WIDTH = 42;

export function renderState(state: State, now: number = Date.now()): string {
  const active = activeCreature(state) ?? state.creatures[state.creatures.length - 1];
  const others = active ? state.creatures.filter((c) => c.id !== active.id) : [];

  const blocks: string[] = [];
  if (active) blocks.push(renderCreatureBox(state, active, now));
  if (others.length > 0) {
    blocks.push(renderRoster(others));
  }
  return blocks.join("\n");
}

export function renderCreatureBox(state: State, c: Creature, now: number): string {
  const lines: string[] = [];
  lines.push(top());
  lines.push(headerRow(c));
  lines.push(divider());
  lines.push(...artRows(c));
  lines.push(divider());
  lines.push(...statsRows(c));
  lines.push(divider());
  lines.push(...metaRows(c));

  const trend = trendRow(c);
  if (trend) {
    lines.push(divider());
    lines.push(trend);
  }
  const footer = footerRow(state, now);
  if (footer) {
    lines.push(divider());
    lines.push(footer);
  }
  lines.push(bottom());

  return lines.join("\n");
}

function renderRoster(others: Creature[]): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`  Other creatures (${others.length}):`);
  for (const c of others) {
    lines.push(`    ${rosterLine(c)}`);
  }
  return lines.join("\n");
}

function rosterLine(c: Creature): string {
  const tag = c.stage === "dead" ? "[💀]" : `[${classDisplayName(c.klass)} · ${stageDisplayName(c.stage)}${c.locked ? " ★" : ""}]`;
  const stats = c.stage === "dead" ? "" : ` STR ${c.stats.str} INT ${c.stats.int} DEX ${c.stats.dex}`;
  const hunger = c.stage === "dead" ? "" : ` ♥ ${Math.floor(c.hunger)}`;
  return `${pad(c.name, 18)} ${tag}${stats}${hunger}`;
}

function top(): string {
  return `╔${"═".repeat(BOX_WIDTH - 2)}╗`;
}
function bottom(): string {
  return `╚${"═".repeat(BOX_WIDTH - 2)}╝`;
}
function divider(): string {
  return `╠${"═".repeat(BOX_WIDTH - 2)}╣`;
}
function row(content: string): string {
  const padCount = BOX_WIDTH - 2 - visibleLength(content);
  const padded = content + " ".repeat(Math.max(0, padCount));
  return `║${padded}║`;
}

function visibleLength(s: string): number {
  return [...s].length;
}

function headerRow(c: Creature): string {
  const klass = c.klass ? classDisplayName(c.klass) : "—";
  const stage = stageDisplayName(c.stage);
  const lock = c.locked ? " ★" : "";
  const tag = c.klass ? `[${klass} · ${stage}${lock}]` : `[${stage}]`;
  const text = ` ${c.name}  ${tag}`;
  return row(text);
}

function artRows(c: Creature): string[] {
  const art = artFor(c.stage, c.klass);
  return art.map((line) => row(`  ${line}`));
}

function statsRows(c: Creature): string[] {
  const hp = maxHp(c);
  const hpBar = bar(hp, hp, 12);
  const foodBar = bar(c.hunger, 100, 12);
  const xpInfo = xpProgress(c);
  const xpBar = bar(xpInfo.current, xpInfo.target, 12);

  return [
    row(`  HP    ${pad(hp.toString(), 4)} / ${pad(hp.toString(), 4)} ${hpBar}`),
    row(`  FOOD  ${pad(Math.floor(c.hunger).toString(), 4)} / 100  ${foodBar}`),
    row(`  XP    ${pad(xpInfo.current.toString(), 4)} / ${pad(xpInfo.target.toString(), 4)} ${xpBar} → ${xpInfo.next}`),
  ];
}

function metaRows(c: Creature): string[] {
  const lvl = level(c);
  const mood = moodOf(c);
  const stats = `  STR ${pad(c.stats.str.toString(), 3)} INT ${pad(c.stats.int.toString(), 3)} DEX ${pad(c.stats.dex.toString(), 3)} LV ${pad(lvl.toString(), 3)}`;
  const meta = `  Mood: ${mood}`;
  return [row(stats), row(meta)];
}

function trendRow(c: Creature): string | null {
  if (c.stage !== "baby") return null;
  if (c.promptsThisStage < TREND_VISIBLE_FROM_PROMPT) return null;

  const ranked = rankedPaths(c.stats).filter((p) => p.pct > 0).slice(0, 3);
  if (ranked.length === 0) return null;

  const txt = ranked.map((r) => `${classDisplayName(r.klass)} ${Math.round(r.pct * 100)}%`).join(" · ");
  return row(`  Path: ${txt}`);
}

function bar(value: number, max: number, width: number): string {
  if (max <= 0) return " ".repeat(width);
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function xpProgress(c: Creature): { current: number; target: number; next: string } {
  if (c.locked) {
    return { current: STAGE_THRESHOLDS.elder, target: STAGE_THRESHOLDS.elder, next: "★ peaked" };
  }
  switch (c.stage) {
    case "egg":
      return { current: c.promptsThisStage, target: STAGE_THRESHOLDS.eggFirst, next: "Baby" };
    case "baby":
      return { current: c.promptsThisStage, target: STAGE_THRESHOLDS.baby, next: "Adult" };
    case "adult":
      return { current: c.promptsThisStage, target: STAGE_THRESHOLDS.adult, next: "Elder" };
    case "elder":
      return { current: c.promptsThisStage, target: STAGE_THRESHOLDS.elder, next: "★ peak" };
    case "dead":
      return { current: 0, target: 1, next: "—" };
  }
}

function relativeTime(then: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function footerRow(state: State, now: number): string | null {
  if (state.mode === "local") return row(`  mode: local`);
  if (!state.cloud) return null;
  const who = state.cloud.username ? `@${state.cloud.username}` : state.cloud.userId.slice(0, 8);
  const lastSync = state.cloud.lastSyncAt ? `synced ${relativeTime(state.cloud.lastSyncAt, now)}` : "not synced yet";
  const err = state.cloud.lastSyncError ? ` ⚠` : "";
  return row(`  mp: ${who} · ${lastSync}${err}`);
}
