// Variant 9: pixel body (V4-style) + wireframe outline overlay (V8-style).
// The fill comes from a smaller 16×16 pixel grid; the outline is drawn
// over it with a 2px stroke per class color.

import type { ReactElement } from "react";

const PALETTE: Record<string, string> = {
  ".": "transparent",
  o: "#3fb950",
  d: "#1f5f1f",
  l: "#7ee787",
  e: "#0a0e0a",
  m: "#0a0e0a",
  r: "#ff7b72",
  c: "#56d3ff",
  p: "#c9a8ff",
  y: "#d29922",
};

interface HybridProps {
  grid: string[];
  outline: ReactElement;
  outlineStroke: string;
  glow: string;
}

function Sprite({ grid, outline, outlineStroke, glow }: HybridProps): ReactElement {
  const cells: ReactElement[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]!;
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!;
      if (ch === ".") continue;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={PALETTE[ch] ?? "#fff"}
        />,
      );
    }
  }
  return (
    <svg
      viewBox="0 0 64 64"
      width={120}
      height={120}
      shapeRendering="crispEdges"
      style={{
        imageRendering: "pixelated" as const,
        filter: `drop-shadow(0 0 6px ${glow})`,
      }}
    >
      {/* 16×16 pixel layer scaled to fill viewBox */}
      <g transform="translate(0 0) scale(4)">{cells}</g>
      {/* outline layer at native 64×64 resolution */}
      <g
        fill="none"
        stroke={outlineStroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {outline}
      </g>
    </svg>
  );
}

const WARRIOR_BODY = [
  "................",
  "....rr....rr....",
  "...r.r....r.r...",
  "..rooooooooor...",
  ".rooddddddooo...",
  ".oodleeoeoldoo..",
  ".oodloooolddo...",
  ".oddommmmoddo...",
  ".oddooooooddo...",
  "..rdddrrddddr...",
  "...oooooooooo...",
  "....oo....oo....",
  "....rr....rr....",
  "....rr....rr....",
  "...rrr....rrr...",
  "................",
];

const SAGE_BODY = [
  "....c.....c.....",
  "....c.....c.....",
  "...ccc...ccc....",
  "....cc.c.cc.....",
  ".....ooooo......",
  "....oooooo......",
  "...ooeolooe.....",
  "..oooooooooo....",
  "..oodooooodo....",
  "...oommmmooo....",
  "....ooooooo.....",
  ".....oo.oo......",
  ".....oo.oo......",
  ".....cc.cc......",
  ".....cc.cc......",
  "....c.....c.....",
];

const TRICKSTER_BODY = [
  "................",
  "..pp........pp..",
  ".popp......ppop.",
  ".pooppppppppoop.",
  "..opooooooooop..",
  "..opdoeooedopo..",
  "..oddoolloodoo..",
  "..oddommmmodoo..",
  "...ooooooooo....",
  "....opooooo.....",
  "....opp.ppo.....",
  "....p.....p.....",
  "...pp.....pp....",
  "..pop.....pop...",
  "..pp.......pp...",
  "................",
];

const BALANCED_BODY = [
  "................",
  ".....yyyy.......",
  "....yoooooy.....",
  "...yooooooyoy...",
  "..yoolooolooy...",
  "..oeooooooeoo...",
  "..oollooollloo..",
  "..oddoommmooddo.",
  "..oddooooooddo..",
  "..oddoooooddo...",
  "...oooooooooo...",
  "....oo.....oo...",
  "....oo.....oo...",
  "....yy.....yy...",
  "....yy.....yy...",
  "................",
];

export function WarriorHybrid() {
  return (
    <Sprite
      grid={WARRIOR_BODY}
      outlineStroke="#ff7b72"
      glow="rgba(255,123,114,0.45)"
      outline={
        <g>
          <path d="M22 18 L18 8 L24 12" />
          <path d="M42 18 L46 8 L40 12" />
          <path d="M22 18 Q22 12 32 12 Q42 12 42 18" />
          <path d="M18 40 L46 40 L44 56 L20 56 Z" />
        </g>
      }
    />
  );
}

export function SageHybrid() {
  return (
    <Sprite
      grid={SAGE_BODY}
      outlineStroke="#56d3ff"
      glow="rgba(86,211,255,0.5)"
      outline={
        <g>
          <path d="M14 10 L14 16 M11 13 L17 13" />
          <path d="M50 12 L50 18 M47 15 L53 15" />
          <circle cx="32" cy="26" r="14" />
        </g>
      }
    />
  );
}

export function TricksterHybrid() {
  return (
    <Sprite
      grid={TRICKSTER_BODY}
      outlineStroke="#c9a8ff"
      glow="rgba(201,168,255,0.5)"
      outline={
        <g>
          <path d="M20 12 L24 6 L26 16" />
          <path d="M44 12 L40 6 L38 16" />
          <path d="M32 14 L48 26 L44 38 L32 44 L20 38 L16 26 Z" />
        </g>
      }
    />
  );
}

export function BalancedHybrid() {
  return (
    <Sprite
      grid={BALANCED_BODY}
      outlineStroke="#d29922"
      glow="rgba(210,153,34,0.5)"
      outline={
        <g>
          <path d="M28 8 Q28 12 32 12 Q36 12 36 8" />
          <path d="M20 16 Q20 12 32 12 Q44 12 44 16 L44 32 Q44 38 32 38 Q20 38 20 32 Z" />
        </g>
      }
    />
  );
}
