import type { ClassName, Mood, Stage } from "../types.js";

export interface Frame {
  lines: string[];
}

const f = (s: string): Frame => ({
  lines: s.split("\n").filter((line, i, arr) => !(i === 0 && line === "") && !(i === arr.length - 1 && line === "")),
});

// === EGG — pulsing crack ===
const EGG_FRAMES: Frame[] = [
  f(`
   ╭─────╮
  ╱       ╲
 │   ◉     │
 │   ╶─    │
  ╲       ╱
   ╰─────╯
`),
  f(`
   ╭─────╮
  ╱       ╲
 │   ◉     │
 │  ╶─╴    │
  ╲   ─   ╱
   ╰─────╯
`),
  f(`
   ╭─────╮
  ╱       ╲
 │   ◉     │
 │   ╶─    │
  ╲       ╱
   ╰─────╯
`),
];

// === BABY by mood ===
const BABY_FRAMES_HAPPY: Frame[] = [
  f(`
    ╭───╮
   ╱^ ^ ╲
   │  ⌣  │
    ╲___╱
    │   │
    ╲___╱
`),
  f(`
    ╭───╮
   ╱^ ^ ╲
   │  ◡  │
    ╲___╱
    │   │
    ╲___╱
`),
  f(`
    ╭───╮
   ╱─ ^ ╲
   │  ⌣  │
    ╲___╱
    │   │
    ╲___╱
`),
];

const BABY_FRAMES_HUNGRY: Frame[] = [
  f(`
    ╭───╮
   ╱◉ ◉ ╲
   │  O  │
    ╲___╱
    │   │
    ╲___╱
`),
  f(`
    ╭───╮
   ╱◉ ◉ ╲
   │  o  │
    ╲___╱
    │   │
    ╲___╱
`),
];

const BABY_FRAMES_TIRED: Frame[] = [
  f(`
    ╭───╮
   ╱─ ─ ╲
   │  ─  │
    ╲___╱
    │   │
    ╲___╱
`),
  f(`
    ╭───╮
   ╱─ ─ ╲
   │  ⌒  │
    ╲___╱
    │   │
    ╲___╱
`),
];

const BABY_FRAMES_SICK: Frame[] = [
  f(`
    ╭───╮
   ╱✕ ✕ ╲
   │  ~  │
    ╲___╱
    │   │
    ╲___╱
`),
];

const BABY_FRAMES_DEFAULT: Frame[] = [
  f(`
    ╭───╮
   ╱◉ ◉ ╲
   │  ─  │
    ╲___╱
    │   │
    ╲___╱
`),
  f(`
    ╭───╮
   ╱◉ ─ ╲
   │  ─  │
    ╲___╱
    │   │
    ╲___╱
`),
];

// === ADULT WARRIOR — bulky, helmet ===
const ADULT_WARRIOR_FRAMES: Frame[] = [
  f(`
    ╲╲ ╱╱
    ╔═══╗
   ║◉   ◉║
   ║  □  ║
    ╚═══╝
    ▌███▐
    ╱   ╲
`),
  f(`
    ╲╲ ╱╱
    ╔═══╗
   ║─   ─║
   ║  □  ║
    ╚═══╝
    ▌███▐
    ╱   ╲
`),
  f(`
    ╲╲ ╱╱
    ╔═══╗
   ║◉   ◉║
   ║  ▼  ║
    ╚═══╝
    ▌███▐
    ╱   ╲
`),
];

// === ADULT SAGE — cosmic round ===
const ADULT_SAGE_FRAMES: Frame[] = [
  f(`
    ✦   ✦
    ╭───╮
   ╱◉   ◉╲
   │  ‿  │
    ╲___╱
    │   │
   ─┴   ┴─
`),
  f(`
    ✧   ✦
    ╭───╮
   ╱◉   ◉╲
   │  ‿  │
    ╲___╱
    │   │
   ─┴   ┴─
`),
  f(`
    ✦   ✧
    ╭───╮
   ╱◉   ◉╲
   │  ◯  │
    ╲___╱
    │   │
   ─┴   ┴─
`),
];

// === ADULT TRICKSTER — pointed ears, slim ===
const ADULT_TRICKSTER_FRAMES: Frame[] = [
  f(`
    ╱╲ ╱╲
   ╱◉ ─ ◉╲
   ╲  ─  ╱
    ╲___╱
    │   │
    │   │
   ╱╲   ╱╲
`),
  f(`
    ╱╲ ╱╲
   ╱─ ─ ◉╲
   ╲  ─  ╱
    ╲___╱
    │   │
    │   │
   ╱╲   ╱╲
`),
  f(`
    ╱╲ ╱╲
   ╱◉ ─ ─╲
   ╲  ─  ╱
    ╲___╱
    │   │
    │   │
   ╱╲   ╱╲
`),
];

// === ADULT BALANCED ===
const ADULT_BALANCED_FRAMES: Frame[] = [
  f(`
     ╭─╮
    ╱◉ ◉╲
    │ ◇ │
     ╲─╱
     │ │
     │ │
    ╱─┴─╲
`),
  f(`
     ╭─╮
    ╱─ ─╲
    │ ◇ │
     ╲─╱
     │ │
     │ │
    ╱─┴─╲
`),
  f(`
     ╭─╮
    ╱◉ ◉╲
    │ ◈ │
     ╲─╱
     │ │
     │ │
    ╱─┴─╲
`),
];

// === ELDER WARLORD — bigger helm + wider stance ===
const ELDER_WARLORD_FRAMES: Frame[] = [
  f(`
    ╲╲▼╱╱
    ╔═══╗
   ║◉   ◉║
   ║  ▼  ║
    ╚═══╝
    ▌███▐
    ▌███▐
`),
  f(`
    ╲╲▼╱╱
    ╔═══╗
   ║─   ─║
   ║  ▼  ║
    ╚═══╝
    ▌███▐
    ▌███▐
`),
];

// === ELDER ARCHMAGE — robed mystic ===
const ELDER_ARCHMAGE_FRAMES: Frame[] = [
  f(`
   ✦ ─ ✦
    ╭───╮
   ╱◉   ◉╲
   │  ◯  │
    ╲___╱
     │ │
    ─┴═┴─
`),
  f(`
   ✧ ─ ✦
    ╭───╮
   ╱◉   ◉╲
   │  ◎  │
    ╲___╱
     │ │
    ─┴═┴─
`),
];

// === ELDER SHADOW — hooded ===
const ELDER_SHADOW_FRAMES: Frame[] = [
  f(`
    ╲▔▔▔╱
    ▕◉ ◉▏
    ╲ ◡ ╱
     ╲╱
    │   │
    │   │
   ╱─╲ ╱─╲
`),
  f(`
    ╲▔▔▔╱
    ▕─ ◉▏
    ╲ ◡ ╱
     ╲╱
    │   │
    │   │
   ╱─╲ ╱─╲
`),
];

// === ELDER DRUID — leafed ===
const ELDER_DRUID_FRAMES: Frame[] = [
  f(`
   ❀───❀
    ╭───╮
   ╱◉ ◉ ╲
   │ ◇◇ │
    ╲___╱
    │   │
    ─╧─╧─
`),
  f(`
   ❀───❀
    ╭───╮
   ╱─ ◉ ╲
   │ ◇◇ │
    ╲___╱
    │   │
    ─╧─╧─
`),
];

// === DEAD ===
const DEAD_FRAMES: Frame[] = [
  f(`
    ╭───╮
   ╱✕   ✕╲
   │  ─  │
    ╲___╱
    ─────
    R.I.P
`),
];

export function framesFor(stage: Stage, klass: ClassName | null, mood: Mood): Frame[] {
  if (stage === "dead") return DEAD_FRAMES;
  if (stage === "egg") return EGG_FRAMES;
  if (stage === "baby") return babyFramesByMood(mood);
  if (stage === "adult") return adultFrames(klass);
  if (stage === "elder") return elderFrames(klass);
  return BABY_FRAMES_DEFAULT;
}

function babyFramesByMood(mood: Mood): Frame[] {
  switch (mood) {
    case "happy":
      return BABY_FRAMES_HAPPY;
    case "hungry":
      return BABY_FRAMES_HUNGRY;
    case "tired":
    case "grumpy":
      return BABY_FRAMES_TIRED;
    case "sick":
      return BABY_FRAMES_SICK;
    default:
      return BABY_FRAMES_DEFAULT;
  }
}

function adultFrames(klass: ClassName | null): Frame[] {
  switch (klass) {
    case "warrior":
      return ADULT_WARRIOR_FRAMES;
    case "sage":
      return ADULT_SAGE_FRAMES;
    case "trickster":
      return ADULT_TRICKSTER_FRAMES;
    case "balanced":
      return ADULT_BALANCED_FRAMES;
    default:
      return ADULT_BALANCED_FRAMES;
  }
}

function elderFrames(klass: ClassName | null): Frame[] {
  switch (klass) {
    case "warlord":
      return ELDER_WARLORD_FRAMES;
    case "archmage":
      return ELDER_ARCHMAGE_FRAMES;
    case "shadow":
      return ELDER_SHADOW_FRAMES;
    case "druid":
      return ELDER_DRUID_FRAMES;
    default:
      return ELDER_DRUID_FRAMES;
  }
}
