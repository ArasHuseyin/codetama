// Variant 4: hand-drawn SVG pixel sprites for each class.
// Each sprite is a 16×16 pixel grid. Pixels are encoded as a string
// of characters per row (one char = one cell):
//   . = empty
//   o = body main
//   d = body dark (shadow)
//   l = body light (highlight)
//   e = eye
//   m = mouth/accent
//   r = red accent (warrior, danger)
//   c = cyan accent (sage, magic)
//   p = purple accent (trickster)
//   y = yellow accent (balanced, eye-glow)

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

function renderSprite(grid: string[]): ReactElement {
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
      viewBox="0 0 16 16"
      width={96}
      height={96}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" as const }}
    >
      {cells}
    </svg>
  );
}

const WARRIOR = [
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

const SAGE = [
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

const TRICKSTER = [
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

const BALANCED = [
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

export function WarriorPixel() { return renderSprite(WARRIOR); }
export function SagePixel() { return renderSprite(SAGE); }
export function TricksterPixel() { return renderSprite(TRICKSTER); }
export function BalancedPixel() { return renderSprite(BALANCED); }
