import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import type { ClassName, Mood, Stage } from "../types.js";
import { framesFor } from "./frames.js";
import { renderOverlay, step, type Particle } from "./particles.js";

interface Props {
  stage: Stage;
  klass: ClassName | null;
  mood: Mood;
}

const PANEL_WIDTH = 28;
const PANEL_HEIGHT = 9;
const FRAME_INTERVAL_MS = 450;
const PARTICLE_INTERVAL_MS = 220;

export function CreaturePanel({ stage, klass, mood }: Props): React.ReactElement {
  const frames = framesFor(stage, klass, mood);
  const [frameIdx, setFrameIdx] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handle = setInterval(() => {
      setFrameIdx((i) => (frames.length === 0 ? 0 : (i + 1) % frames.length));
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [frames.length]);

  useEffect(() => {
    const handle = setInterval(() => {
      setParticles((ps) => step(ps, mood, PANEL_WIDTH));
    }, PARTICLE_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [mood]);

  const frame = frames[frameIdx % frames.length] ?? frames[0];
  const overlay = renderOverlay(particles, PANEL_WIDTH, PANEL_HEIGHT);
  const composed = composeFrameWithOverlay(frame?.lines ?? [], overlay, PANEL_WIDTH, PANEL_HEIGHT);

  return (
    <Box flexDirection="column" width={PANEL_WIDTH} height={PANEL_HEIGHT}>
      {composed.map((line, i) => (
        <Text key={`line-${i}`}>{line || " "}</Text>
      ))}
    </Box>
  );
}

function composeFrameWithOverlay(
  art: string[],
  overlay: string[],
  width: number,
  height: number,
): string[] {
  const result: string[] = [];
  const offsetY = Math.max(0, Math.floor((height - art.length) / 2));

  for (let y = 0; y < height; y++) {
    const overlayRow = (overlay[y] ?? " ".repeat(width)).split("");
    const artRow = art[y - offsetY] ?? "";
    const merged: string[] = [];

    for (let x = 0; x < width; x++) {
      const artChar = artRow[x] ?? " ";
      const ovChar = overlayRow[x] ?? " ";
      const cell = artChar !== " " ? artChar : ovChar;
      merged.push(cell);
    }
    result.push(merged.join("").replace(/\s+$/, ""));
  }
  return result;
}
