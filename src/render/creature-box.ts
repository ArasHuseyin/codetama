import { moodOf } from "../core/hunger.js";
import { rankedPaths } from "../core/classes.js";
import { activeCreature } from "../core/state.js";
import { streakStatus } from "../core/streak.js";
import {
  STAGE_THRESHOLDS,
  TREND_VISIBLE_FROM_PROMPT,
  level,
  maxHp,
  type Creature,
  type State,
} from "../types.js";
import { artFor, classDisplayName, stageDisplayName } from "./art.js";
import {
  c,
  classColor,
  moodColor,
  moodIcon,
  ratioColor,
  visibleLength,
} from "./colors.js";

const BOX_WIDTH = 42;
const BORDER = c.gray;

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

export function renderCreatureBox(state: State, creature: Creature, now: number): string {
  const lines: string[] = [];
  lines.push(top());
  lines.push(headerRow(creature));
  lines.push(divider());
  lines.push(...artRows(creature));
  lines.push(divider());
  lines.push(...statsRows(creature));
  lines.push(divider());
  lines.push(...metaRows(creature));

  const trend = trendRow(creature);
  if (trend) {
    lines.push(divider());
    lines.push(trend);
  }
  const streak = streakRow(state, now);
  if (streak) {
    lines.push(divider());
    lines.push(streak);
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
  lines.push(`  ${c.dim(`Other creatures (${others.length}):`)}`);
  for (const cr of others) {
    lines.push(`    ${rosterLine(cr)}`);
  }
  return lines.join("\n");
}

function rosterLine(cr: Creature): string {
  if (cr.stage === "dead") {
    return `${c.dim(pad(cr.name, 18))} ${c.dim("[† dead]")}`;
  }
  const klassPaint = classColor(cr.klass);
  const tag = `[${klassPaint(classDisplayName(cr.klass))} · ${stageDisplayName(cr.stage)}${cr.locked ? c.brightYellow(" ★") : ""}]`;
  const stats = ` ${c.red(`STR ${cr.stats.str}`)} ${c.cyan(`INT ${cr.stats.int}`)} ${c.magenta(`DEX ${cr.stats.dex}`)}`;
  const hungerColor = ratioColor(cr.hunger / 100);
  const hunger = ` ${hungerColor(`♥ ${Math.floor(cr.hunger)}`)}`;
  return `${c.bold(pad(cr.name, 18))} ${tag}${stats}${hunger}`;
}

function top(): string {
  return BORDER(`╔${"═".repeat(BOX_WIDTH - 2)}╗`);
}
function bottom(): string {
  return BORDER(`╚${"═".repeat(BOX_WIDTH - 2)}╝`);
}
function divider(): string {
  return BORDER(`╠${"═".repeat(BOX_WIDTH - 2)}╣`);
}
function row(content: string): string {
  const padCount = BOX_WIDTH - 2 - visibleLength(content);
  const padded = content + " ".repeat(Math.max(0, padCount));
  return `${BORDER("║")}${padded}${BORDER("║")}`;
}

function headerRow(creature: Creature): string {
  const klassPaint = classColor(creature.klass);
  const stage = stageDisplayName(creature.stage);
  const stagePaint = stagePaintFor(creature.stage);
  const lock = creature.locked ? c.brightYellow(" ★") : "";
  const tag = creature.klass
    ? `[${klassPaint(classDisplayName(creature.klass))} · ${stagePaint(stage)}${lock}]`
    : `[${stagePaint(stage)}]`;
  const text = ` ${c.bold(klassPaint(creature.name))}  ${tag}`;
  return row(text);
}

function stagePaintFor(stage: Creature["stage"]): (s: string) => string {
  switch (stage) {
    case "egg":
      return c.yellow;
    case "baby":
      return c.brightGreen;
    case "adult":
      return c.bold;
    case "elder":
      return c.brightYellow;
    case "dead":
      return c.gray;
  }
}

function artRows(creature: Creature): string[] {
  const art = artFor(creature.stage, creature.klass);
  const paint = creature.stage === "dead" ? c.gray : classColor(creature.klass);
  return art.map((line) => row(`  ${paint(line)}`));
}

function statsRows(creature: Creature): string[] {
  const hp = maxHp(creature);
  const hpRatio = 1;
  const hpBar = bar(hp, hp, 12, ratioColor(hpRatio));
  const foodRatio = creature.hunger / 100;
  const foodBar = bar(creature.hunger, 100, 12, ratioColor(foodRatio));
  const xpInfo = xpProgress(creature);
  const xpBar = bar(xpInfo.current, xpInfo.target, 12, c.cyan);
  const nextLabel = creature.locked ? c.brightYellow(xpInfo.next) : c.dim(`→ ${xpInfo.next}`);

  return [
    row(`  ${c.dim("HP")}    ${pad(hp.toString(), 4)} / ${pad(hp.toString(), 4)} ${hpBar}`),
    row(`  ${c.dim("FOOD")}  ${pad(Math.floor(creature.hunger).toString(), 4)} / 100  ${foodBar}`),
    row(`  ${c.dim("XP")}    ${pad(xpInfo.current.toString(), 4)} / ${pad(xpInfo.target.toString(), 4)} ${xpBar} ${nextLabel}`),
  ];
}

function metaRows(creature: Creature): string[] {
  const lvl = level(creature);
  const mood = moodOf(creature);
  const moodPaint = moodColor(mood);
  const stats =
    `  ${c.red(`STR ${pad(creature.stats.str.toString(), 3)}`)} ` +
    `${c.cyan(`INT ${pad(creature.stats.int.toString(), 3)}`)} ` +
    `${c.magenta(`DEX ${pad(creature.stats.dex.toString(), 3)}`)} ` +
    `${c.brightYellow(`LV ${pad(lvl.toString(), 3)}`)}`;
  const meta = `  ${c.dim("Mood:")} ${moodPaint(`${moodIcon(mood)} ${mood}`)}`;
  return [row(stats), row(meta)];
}

function streakRow(state: State, now: number): string | null {
  const s = streakStatus(state, now);
  if (s.days <= 0) return null;
  const flame = s.days >= 7 ? c.brightYellow("🔥") : c.yellow("•");
  const label = s.days === 1 ? "day" : "days";
  const longest = state.streak?.longestDays ?? s.days;
  const longestPart = longest > s.days ? c.dim(` (best ${longest})`) : "";
  return row(`  ${c.dim("Streak:")} ${flame} ${c.bold(`${s.days} ${label}`)}${longestPart}`);
}

function trendRow(creature: Creature): string | null {
  if (creature.stage !== "baby") return null;
  if (creature.promptsThisStage < TREND_VISIBLE_FROM_PROMPT) return null;

  const ranked = rankedPaths(creature.stats).filter((p) => p.pct > 0).slice(0, 3);
  if (ranked.length === 0) return null;

  const txt = ranked
    .map((r) => `${classColor(r.klass)(classDisplayName(r.klass))} ${c.dim(`${Math.round(r.pct * 100)}%`)}`)
    .join(c.dim(" · "));
  return row(`  ${c.dim("Path:")} ${txt}`);
}

function bar(value: number, max: number, width: number, paint: (s: string) => string): string {
  if (max <= 0) return " ".repeat(width);
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return paint("█".repeat(filled)) + c.dim("░".repeat(width - filled));
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function xpProgress(creature: Creature): { current: number; target: number; next: string } {
  if (creature.locked) {
    return { current: STAGE_THRESHOLDS.elder, target: STAGE_THRESHOLDS.elder, next: "★ peaked" };
  }
  switch (creature.stage) {
    case "egg":
      return { current: creature.promptsThisStage, target: STAGE_THRESHOLDS.eggFirst, next: "Baby" };
    case "baby":
      return { current: creature.promptsThisStage, target: STAGE_THRESHOLDS.baby, next: "Adult" };
    case "adult":
      return { current: creature.promptsThisStage, target: STAGE_THRESHOLDS.adult, next: "Elder" };
    case "elder":
      return { current: creature.promptsThisStage, target: STAGE_THRESHOLDS.elder, next: "★ peak" };
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
  if (state.mode === "local") return row(`  ${c.dim("mode:")} ${c.cyan("local")}`);
  if (!state.cloud) return null;
  const who = state.cloud.username
    ? c.brightCyan(`@${state.cloud.username}`)
    : c.cyan(state.cloud.userId.slice(0, 8));
  const lastSync = state.cloud.lastSyncAt
    ? c.dim(`synced ${relativeTime(state.cloud.lastSyncAt, now)}`)
    : c.yellow("not synced yet");
  const err = state.cloud.lastSyncError ? ` ${c.brightRed("⚠")}` : "";
  return row(`  ${c.dim("mp:")} ${who} ${c.dim("·")} ${lastSync}${err}`);
}
