import type { EventLine } from "../core/events.js";
import type { RemoteEvent } from "../types.js";
import { c } from "./colors.js";

const PALETTE: Record<EventLine["kind"], (s: string) => string> = {
  hatched: c.brightGreen,
  evolved: c.brightCyan,
  locked: c.brightYellow,
  died: c.brightRed,
  prompts: c.cyan,
  stats: c.magenta,
};

export function renderEventLine(events: EventLine[]): string {
  if (events.length === 0) return "";
  const grouped: Record<string, string[]> = {};
  for (const e of events) {
    const paint = PALETTE[e.kind];
    (grouped[e.kind] ??= []).push(paint(e.text));
  }
  const order: EventLine["kind"][] = ["hatched", "evolved", "locked", "died", "prompts", "stats"];
  const parts: string[] = [];
  for (const kind of order) {
    if (grouped[kind]) parts.push(...grouped[kind]);
  }
  return `  ${c.dim("since last look:")} ${parts.join(c.dim(" · "))}`;
}

export function renderBigEventBanner(events: EventLine[]): string {
  const big = events.find((e) => e.kind === "died" || e.kind === "evolved" || e.kind === "locked");
  if (!big) return "";

  if (big.kind === "died") {
    return [
      "",
      c.brightRed("    ╔══════════════════════════════════╗"),
      c.brightRed("    ║                                  ║"),
      c.brightRed("    ║   ✝   YOUR CREATURE HAS DIED ✝   ║"),
      c.brightRed("    ║                                  ║"),
      c.brightRed("    ╚══════════════════════════════════╝"),
      "",
      `    ${c.gray(big.text)}`,
      "",
    ].join("\n");
  }

  if (big.kind === "locked") {
    return [
      "",
      c.brightYellow("    ╔══════════════════════════════════╗"),
      c.brightYellow("    ║   ★  ELDER PEAKED — LOCKED  ★    ║"),
      c.brightYellow("    ╚══════════════════════════════════╝"),
      `    ${c.dim(big.text)}`,
      `    ${c.dim("a fresh egg is waiting for you.")}`,
      "",
    ].join("\n");
  }

  return [
    "",
    c.brightCyan("    ╔══════════════════════════════════╗"),
    c.brightCyan("    ║       ✦  EVOLUTION  ✦            ║"),
    c.brightCyan("    ╚══════════════════════════════════╝"),
    `    ${c.bold(big.text)}`,
    "",
  ].join("\n");
}

export function renderRemoteEvents(events: RemoteEvent[]): string {
  const unseen = events.filter((e) => !e.shown);
  if (unseen.length === 0) return "";
  const lines: string[] = [];
  for (const e of unseen) {
    if (e.kind === "tile_lost") {
      const p = e.payload as { x?: number; y?: number; attackerName?: string } | null;
      const who = p?.attackerName ?? "someone";
      const where = p && typeof p.x === "number" && typeof p.y === "number" ? `(${p.x}, ${p.y})` : "";
      lines.push(`  ${c.brightRed("⚔")} ${c.bold(who)} ${c.dim("captured your tile")} ${c.dim(where)}`);
    } else {
      lines.push(`  ${c.dim("· event:")} ${e.kind}`);
    }
  }
  return lines.join("\n");
}
