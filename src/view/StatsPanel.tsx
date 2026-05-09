import React from "react";
import { Box, Text } from "ink";
import { rankedPaths } from "../core/classes.js";
import {
  STAGE_THRESHOLDS,
  TREND_VISIBLE_FROM_PROMPT,
  level,
  maxHp,
  type Creature,
  type Mood,
  type State,
} from "../types.js";

interface Props {
  state: State;
  active: Creature | null;
  mood: Mood;
}

const BAR_WIDTH = 14;

export function StatsPanel({ state, active, mood }: Props): React.ReactElement {
  if (!active) {
    return (
      <Box flexDirection="column">
        <Text color="red">No active creature.</Text>
      </Box>
    );
  }
  const c = active;
  const others = state.creatures.filter((x) => x.id !== c.id);
  const hp = maxHp(c);
  const xp = xpProgress(c);
  const lvl = level(c);

  const trend = c.stage === "baby" && c.promptsThisStage >= TREND_VISIBLE_FROM_PROMPT ? topPaths(c.stats) : null;

  return (
    <Box flexDirection="column">
      <Text color="cyan">
        {c.name}
        <Text color="white">  </Text>
        <Text color="yellow">
          [{c.klass ? capitalize(c.klass) : "—"} · {capitalize(c.stage)}{c.locked ? " ★" : ""}]
        </Text>
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Row label="HP  " value={`${hp} / ${hp}`} bar={bar(hp, hp)} color="red" />
        <Row label="FOOD" value={`${Math.floor(c.hunger)} / 100`} bar={bar(c.hunger, 100)} color="green" />
        <Row label="XP  " value={`${xp.current} / ${xp.target}`} bar={bar(xp.current, xp.target)} color="magenta" extra={`→ ${xp.next}`} />
      </Box>
      <Box marginTop={1}>
        <Text>STR </Text>
        <Text color="red">{pad(c.stats.str.toString(), 3)}</Text>
        <Text>  INT </Text>
        <Text color="cyan">{pad(c.stats.int.toString(), 3)}</Text>
        <Text>  DEX </Text>
        <Text color="green">{pad(c.stats.dex.toString(), 3)}</Text>
        <Text>  LV </Text>
        <Text color="yellow">{pad(lvl.toString(), 3)}</Text>
      </Box>
      <Box>
        <Text>Mood: </Text>
        <Text color={moodColor(mood)}>{mood}</Text>
      </Box>
      {trend && (
        <Box marginTop={1}>
          <Text dimColor>Path: {trend}</Text>
        </Box>
      )}
      {others.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>others ({others.length}):</Text>
          {others.slice(0, 5).map((o) => (
            <Text key={o.id} dimColor>
              {"  · "}
              <Text color="cyan">{o.name}</Text>{" "}
              [{o.klass ? capitalize(o.klass) : "—"} · {capitalize(o.stage)}{o.locked ? " ★" : ""}]{" "}
              ♥{Math.floor(o.hunger)}
            </Text>
          ))}
          {others.length > 5 && <Text dimColor>{"  …+ "}{others.length - 5} more</Text>}
        </Box>
      )}
    </Box>
  );
}

function Row(props: { label: string; value: string; bar: string; color: string; extra?: string }): React.ReactElement {
  return (
    <Box>
      <Text>{props.label} </Text>
      <Text color={props.color}>{props.bar}</Text>
      <Text> {props.value}</Text>
      {props.extra ? <Text dimColor>  {props.extra}</Text> : null}
    </Box>
  );
}

function bar(value: number, max: number): string {
  if (max <= 0) return "░".repeat(BAR_WIDTH);
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((value / max) * BAR_WIDTH)));
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : " ".repeat(n - s.length) + s;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function moodColor(mood: Mood): string {
  switch (mood) {
    case "happy":
      return "green";
    case "content":
      return "cyan";
    case "hungry":
      return "yellow";
    case "tired":
      return "blue";
    case "grumpy":
      return "magenta";
    case "sick":
      return "red";
  }
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

function topPaths(stats: Creature["stats"]): string {
  const ranked = rankedPaths(stats).filter((p) => p.pct > 0).slice(0, 3);
  return ranked.map((r) => `${capitalize(r.klass)} ${Math.round(r.pct * 100)}%`).join(" · ");
}
