import type { ClassName, Stage } from "../types.js";

const EGG = `
  .-""-.
 /  .-. \\
|  / o \\ |
|  \\___/ |
 \\      /
  '----'
`;

const BABY = `
   .---.
  ( o o )
   \\_-_/
   /   \\
  '-----'
`;

const ADULT_WARRIOR = `
   ___,
  /o o\\__
 ( =T= )_)
  \\___//
   |||
  / | \\
`;

const ADULT_SAGE = `
   .-~~~-.
  /  o o  \\
 |   <>    |
  \\  '-'  /
   '~~~~'
    | |
`;

const ADULT_TRICKSTER = `
   /\\_/\\
  ( o.^ )
   > ^ <
   |_|_|
`;

const ADULT_BALANCED = `
    ___
   /o o\\
  ( ==  )
   \\___/
   /| |\\
`;

const ELDER_WARLORD = `
   .===.
  / o o \\
 |  ===  |
 |  |||  |
  \\_____/
   /| |\\
   |   |
`;

const ELDER_ARCHMAGE = `
    ___
   /\\*/\\
  ( o o )
  | === |
   \\_-_/
    |||
   *   *
`;

const ELDER_SHADOW = `
   .===.
  ( o.o )
  ( ___ )
   \\___/
   /   \\
`;

const ELDER_DRUID = `
    ~~~
   /o o\\
  | (_) |
   \\___/
   /| |\\
  ~     ~
`;

const DEAD = `
   _____
  /  x  \\
 |  x x  |
  \\__~__/
   R.I.P.
`;

export function artFor(stage: Stage, klass: ClassName | null): string[] {
  const raw = pickRaw(stage, klass);
  return raw.split("\n").filter((line, i, arr) => !(i === 0 && line === "") && !(i === arr.length - 1 && line === ""));
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
