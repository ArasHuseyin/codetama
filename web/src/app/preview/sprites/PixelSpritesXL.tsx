// Variant 6: 32×32 SVG pixel sprites — bigger canvas, proper shading layers.

import type { ReactElement } from "react";

const PALETTE: Record<string, string> = {
  ".": "transparent",
  "k": "#0a0e0a",   // outline / black
  "o": "#3fb950",   // body main
  "d": "#1f5f1f",   // body shadow
  "l": "#7ee787",   // body highlight
  "w": "#dcfce7",   // bright highlight
  "e": "#0a0e0a",   // eye
  "i": "#ffffff",   // eye iris white
  "r": "#ff7b72",   // red accent
  "R": "#a83232",   // red shadow
  "c": "#56d3ff",   // cyan accent
  "C": "#1f6f8a",   // cyan shadow
  "p": "#c9a8ff",   // purple accent
  "P": "#6a4ea0",   // purple shadow
  "y": "#d29922",   // yellow accent
  "Y": "#7a5a16",   // yellow shadow
  "m": "#ff7b72",   // mouth/danger
  "g": "#a8a8a8",   // gray (metal)
  "G": "#5a5a5a",   // gray shadow
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
      viewBox="0 0 32 32"
      width={120}
      height={120}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" as const }}
    >
      {cells}
    </svg>
  );
}

const WARRIOR_XL = [
  "................................",
  "..........kkkkkkkk..............",
  ".........kgggggggk..............",
  "........kggGGGGggk..............",
  ".......kggGGgggGGggk............",
  "......kggGGgggggGGggk...........",
  ".....kkggggggggggggkk...........",
  "....kkooooooooooooookk..........",
  "...kkoollllllllooolokk..........",
  "...kollwlieieileelolokk.........",
  "...koldoooooooooodloko..........",
  "...koldoeeeeeoeeoodlok..........",
  "...koldoooooooooodlok...........",
  "...koldlllooollldldlok..........",
  "...kodddooooooodddok............",
  "....kogggggggggggok.............",
  "....koggggGGGgggok..............",
  "....koggggggggggok..............",
  "....kogggggggggok...............",
  "....k.gggggggg.k................",
  ".....kggGGGGggk.................",
  ".....kgg....ggk.................",
  ".....kgg....ggk.................",
  "....kkgg....ggkk................",
  "...rR.gg....gg.Rr...............",
  "...rRkkk....kkkRr...............",
  "...rR..........Rr...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

const SAGE_XL = [
  "...........c..........c.........",
  "..........ccc........ccc........",
  "..........c.c........c.c........",
  "...........c..........c.........",
  "................................",
  "...........kkkkkkkk.............",
  "..........koooooooook...........",
  ".........kollllllllok...........",
  ".........koolwlllolok...........",
  "........koollllllolok...........",
  "........koleieieelolok..........",
  "........kodoeeoeoodlok..........",
  "........kodooooooodlok..........",
  "........koddommmmddlok..........",
  ".........kdddooooddok...........",
  ".........kdddooooddok...........",
  ".........koooooooook............",
  "..........kkooooKkk.............",
  "...........koooook..............",
  "...........kooook...............",
  "...........kooook...............",
  ".....c.....k....k.....c.........",
  "....ccc...kk....kk...ccc........",
  "....c.c..k........k..c.c........",
  ".....c..kk........kk..c.........",
  "........k..........k............",
  "........k..........k............",
  "........kk........kk............",
  "...c.....kkkkkkkkkk.....c.......",
  "..ccc...................ccc.....",
  "..c.c...................c.c.....",
  "...c.....................c......",
];

const TRICKSTER_XL = [
  "................................",
  "....pp..................pp......",
  "...pop..................pop.....",
  "..popp..................ppop....",
  ".pooppp................pppoop...",
  ".pooppppppppppppppppppppppoop...",
  "..ooppoooooooooooooooooppoo.....",
  "...ooopllllllllllllllpooo.......",
  "....oppooollllllllooopo.........",
  "...oopdooieelleieoopdo..........",
  "..ooopdooeeooooeoopdoo..........",
  "..ooopdoooollllooopdoo..........",
  "...oopdoommmmmoopdoo............",
  "....oopddoooooopdoo.............",
  "....ooopdddddpdoo...............",
  "....opooooooooopo...............",
  "....opppppppppoo................",
  "...op..........po...............",
  "...op..........po...............",
  "...pp..........pp...............",
  "..pop..........pop..............",
  "..pp............pp..............",
  "..p..............p..............",
  ".pp..............pp.............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

const BALANCED_XL = [
  "................................",
  "..........yyyyyyyyy.............",
  "........yyooooooooyy............",
  ".......yooollllllooyy...........",
  "......yoolllwwwlllloy...........",
  "......yolllwwwwwlllloy..........",
  ".....yolldlieieileldolloy.......",
  ".....yoldoeeeeeeeeeeolldoy......",
  ".....yoldoooooooooolldoy........",
  ".....yoldoollllooollldoy........",
  ".....yoldlooommmoooldldoy.......",
  ".....yoddoooooooodddoy..........",
  "......yoodddoodddooyy...........",
  "......yyooooooooooyy............",
  ".......yyooooooooyy.............",
  "........yyoooooyy...............",
  ".........yyoooyy................",
  "..........yooy..................",
  "..........yyy...................",
  "..........y.y...................",
  ".........yy.yy..................",
  ".........y...y..................",
  "........yy...yy.................",
  "........y.....y.................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

export function WarriorXL() { return renderSprite(WARRIOR_XL); }
export function SageXL() { return renderSprite(SAGE_XL); }
export function TricksterXL() { return renderSprite(TRICKSTER_XL); }
export function BalancedXL() { return renderSprite(BALANCED_XL); }
