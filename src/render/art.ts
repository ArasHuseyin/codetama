import type { ClassName, Stage } from "../types.js";

const EGG = `
   ╭─────╮
  ╱       ╲
 │   ◉     │
 │   ╶─    │
  ╲       ╱
   ╰─────╯
`;

const BABY = `
    ╭───╮
   ╱◉ ◉ ╲
   │  ⌣  │
    ╲___╱
    │   │
    ╲___╱
`;

const ADULT_WARRIOR = `
    ╲╲ ╱╱
    ╔═══╗
   ║◉   ◉║
   ║  □  ║
    ╚═══╝
    ▌███▐
    ╱   ╲
`;

const ADULT_SAGE = `
    ✦   ✦
    ╭───╮
   ╱◉   ◉╲
   │  ‿  │
    ╲___╱
    │   │
   ─┴   ┴─
`;

const ADULT_TRICKSTER = `
    ╱╲ ╱╲
   ╱◉ ─ ◉╲
   ╲  ─  ╱
    ╲___╱
    │   │
    │   │
   ╱╲   ╱╲
`;

const ADULT_BALANCED = `
     ╭─╮
    ╱◉ ◉╲
    │ ◇ │
     ╲─╱
     │ │
     │ │
    ╱─┴─╲
`;

const ELDER_WARLORD = `
    ╲╲▼╱╱
    ╔═══╗
   ║◉   ◉║
   ║  ▼  ║
    ╚═══╝
    ▌███▐
    ▌███▐
`;

const ELDER_ARCHMAGE = `
   ✦ ─ ✦
    ╭───╮
   ╱◉   ◉╲
   │  ◯  │
    ╲___╱
     │ │
    ─┴═┴─
`;

const ELDER_SHADOW = `
    ╲▔▔▔╱
    ▕◉ ◉▏
    ╲ ◡ ╱
     ╲╱
    │   │
    │   │
   ╱─╲ ╱─╲
`;

const ELDER_DRUID = `
   ❀───❀
    ╭───╮
   ╱◉ ◉ ╲
   │ ◇◇ │
    ╲___╱
    │   │
    ─╧─╧─
`;

const DEAD = `
    ╭───╮
   ╱✕   ✕╲
   │  ─  │
    ╲___╱
    ─────
    R.I.P
`;

export function artFor(stage: Stage, klass: ClassName | null): string[] {
  const raw = pickRaw(stage, klass);
  return raw
    .split("\n")
    .filter((line, i, arr) => !(i === 0 && line === "") && !(i === arr.length - 1 && line === ""));
}

function pickRaw(stage: Stage, klass: ClassName | null): string {
  switch (stage) {
    case "egg":
      return EGG;
    case "baby":
      return BABY;
    case "adult":
      switch (klass) {
        case "warrior":
          return ADULT_WARRIOR;
        case "sage":
          return ADULT_SAGE;
        case "trickster":
          return ADULT_TRICKSTER;
        case "balanced":
          return ADULT_BALANCED;
        default:
          return ADULT_BALANCED;
      }
    case "elder":
      switch (klass) {
        case "warlord":
          return ELDER_WARLORD;
        case "archmage":
          return ELDER_ARCHMAGE;
        case "shadow":
          return ELDER_SHADOW;
        case "druid":
          return ELDER_DRUID;
        default:
          return ELDER_DRUID;
      }
    case "dead":
      return DEAD;
  }
}

export function classDisplayName(klass: ClassName | null): string {
  if (!klass) return "—";
  return klass.charAt(0).toUpperCase() + klass.slice(1);
}

export function stageDisplayName(stage: Stage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
