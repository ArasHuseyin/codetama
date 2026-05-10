// Creature sprites keyed by state. Each is a multi-line monospace string.
// Designed to be 5 lines tall and ~9 columns wide so combatants share visual cadence.

export type AttackerState = "idle" | "wind_up" | "strike" | "hit" | "victory" | "dead";
export type DefenderState = "idle" | "channel" | "cast" | "hit" | "victory" | "dead";

export const TRICKSTER: Record<AttackerState, string> = {
  idle: `   /\\_/\\
  ( o.^ )
   > ^ <
   |_|_|
   /| |\\`,
  wind_up: `   /\\_/\\
  ( O.O )
   > · <
   /|_|\\
   /v v\\`,
  strike: `      /\\_/\\
     ( o.^ )
      >——<
      |_|_|
     / | | \\`,
  hit: `   /\\_/\\
  ( x_x )
   > 0 <
   |_|_|
   /| |\\`,
  victory: `   /\\_/\\
  ( ^_^ )
   > o <
   |_|_|
   /| |\\`,
  dead: `   /\\_/\\
  ( -.- )
   ─ ─ ─
   |___|
        `,
};

export const SAGE: Record<DefenderState, string> = {
  idle: `    ___
   /o o\\
  ( == )
   \\___/
   /| |\\`,
  channel: `    ___
   /o o\\
  ( ◇◇ )
   \\___/
   /| |\\`,
  cast: `    ___
   /◉ ◉\\
  ( !! )
   \\___/
   /| |\\`,
  hit: `    ___
   /x x\\
  ( -- )
   \\___/
   /| |\\`,
  victory: `    ___
   /^ ^\\
  ( ▽▽ )
   \\___/
   /| |\\`,
  dead: `    ___
   /xxx\\
  ( -- )
  ──────
        `,
};

// Compact sprites for the class registry section (5 lines, single state).
export interface ClassDef {
  name: string;
  elder: string;
  stat: string;
  sigil: string;
  blurb: string;
  ult: string;
  ascii: string;
}

export const CLASSES: ClassDef[] = [
  {
    name: "WARRIOR",
    elder: "WARLORD",
    stat: "STR",
    sigil: "⚔",
    blurb: "raised on Bash. hits hard.",
    ult: "Cleave",
    ascii: `   ___,
  /o o\\__
 ( =T= )_)
  \\___//
   |||
  / | \\`,
  },
  {
    name: "SAGE",
    elder: "ARCHMAGE",
    stat: "INT",
    sigil: "✦",
    blurb: "raised on Read. patient, lethal.",
    ult: "Tidewave",
    ascii: `   .-~~~-.
  /  o o  \\
 |   <>    |
  \\  '-'  /
   '~~~~'
    | |`,
  },
  {
    name: "TRICKSTER",
    elder: "SHADOW",
    stat: "DEX",
    sigil: "⚡",
    blurb: "raised on Edit. dodges what hits.",
    ult: "Veil",
    ascii: `   /\\_/\\
  ( o.^ )
   > ^ <
   |_|_|
   /| |\\
        `,
  },
  {
    name: "BALANCED",
    elder: "DRUID",
    stat: "EVEN",
    sigil: "◈",
    blurb: "no extreme. no weak link.",
    ult: "Rootlash",
    ascii: `    ___
   /o o\\
  ( ==  )
   \\___/
   /| |\\
        `,
  },
];
