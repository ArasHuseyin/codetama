import type { ClassName, Mood, Stage } from "../types.js";

export interface Frame {
  lines: string[];
}

const f = (s: string): Frame => ({
  lines: s.split("\n").filter((line, i, arr) => !(i === 0 && line === "") && !(i === arr.length - 1 && line === "")),
});

const EGG_FRAMES: Frame[] = [
  f(`
   .-""-.
  /  .-. \\
 |  / o \\ |
 |  \\___/ |
  \\      /
   '----'
`),
  f(`
   .-""-.
  /  .-. \\
 |  /o  \\ |
 |  \\___/ |
  \\  __  /
   '----'
`),
  f(`
   .-""-.
  /  .-. \\
 |  /  o\\ |
 |  \\___/ |
  \\      /
   '----'
`),
];

const BABY_FRAMES_HAPPY: Frame[] = [
  f(`
    .---.
   ( ^ ^ )
    \\_o_/
    /   \\
   '-----'
`),
  f(`
    .---.
   ( ^ ^ )
    \\___/
    /   \\
   '-----'
`),
  f(`
    .---.
   ( - - )
    \\_o_/
    /   \\
   '-----'
`),
];

const BABY_FRAMES_HUNGRY: Frame[] = [
  f(`
    .---.
   ( o o )
    \\_O_/
    /   \\
   '-----'
`),
  f(`
    .---.
   ( o o )
    \\_o_/
    /   \\
   '-----'
`),
];

const BABY_FRAMES_TIRED: Frame[] = [
  f(`
    .---.
   ( - - )
    \\___/
    /   \\
   '-----'
`),
  f(`
    .---.
   ( - _ )
    \\___/
    /   \\
   '-----'
`),
];

const BABY_FRAMES_SICK: Frame[] = [
  f(`
    .---.
   ( x x )
    \\~~~/
    /   \\
   '-----'
`),
];

const BABY_FRAMES_DEFAULT: Frame[] = [
  f(`
    .---.
   ( o o )
    \\_-_/
    /   \\
   '-----'
`),
  f(`
    .---.
   ( - - )
    \\_-_/
    /   \\
   '-----'
`),
];

const ADULT_WARRIOR_FRAMES: Frame[] = [
  f(`
    ___,
   /o o\\__
  ( =T= )_)
   \\___//
    |||
   / | \\
`),
  f(`
    ___,
   /^ ^\\__
  ( =T= )_)
   \\___//
    |||
   / | \\
`),
  f(`
    ___,
   /o o\\__
  ( =T= )__)
   \\___//
    |||
  __/ | \\__
`),
];

const ADULT_SAGE_FRAMES: Frame[] = [
  f(`
   .-~~~-.
  /  o o  \\
 |   <>    |
  \\  '-'  /
   '~~~~'
    | |
`),
  f(`
   .-~~~-.
  /  ^ ^  \\
 |   <>    |
  \\  '-'  /
   '~~~~'
    | |
`),
  f(`
   .-~~~-.
  /  o o  \\
 |   <O>   |
  \\  '-'  /
   '~~~~'
    | |
`),
];

const ADULT_TRICKSTER_FRAMES: Frame[] = [
  f(`
    /\\_/\\
   ( o.^ )
    > ^ <
    |_|_|
`),
  f(`
    /\\_/\\
   ( -.^ )
    > ^ <
    |_|_|
`),
  f(`
    /\\_/\\
   ( ^.o )
    > ^ <
    |_|_|
`),
];

const ADULT_BALANCED_FRAMES: Frame[] = [
  f(`
     ___
    /o o\\
   ( ==  )
    \\___/
    /| |\\
`),
  f(`
     ___
    /- -\\
   ( ==  )
    \\___/
    /| |\\
`),
  f(`
     ___
    /o o\\
   ( __  )
    \\___/
    /| |\\
`),
];

const ELDER_WARLORD_FRAMES: Frame[] = [
  f(`
    .===.
   / o o \\
  |  ===  |
  |  |||  |
   \\_____/
    /| |\\
    |   |
`),
  f(`
    .===.
   / ^ ^ \\
  |  ===  |
  |  |||  |
   \\_____/
    /| |\\
    |   |
`),
];

const ELDER_ARCHMAGE_FRAMES: Frame[] = [
  f(`
     ___
    /\\*/\\
   ( o o )
   | === |
    \\_-_/
     |||
    *   *
`),
  f(`
     ___
    /\\*/\\
   ( ^ ^ )
   | === |
    \\_-_/
     |||
    *   *
`),
];

const ELDER_SHADOW_FRAMES: Frame[] = [
  f(`
    .===.
   ( o.o )
   ( ___ )
    \\___/
    /   \\
`),
  f(`
    .===.
   ( ^.^ )
   ( ___ )
    \\___/
    /   \\
`),
];

const ELDER_DRUID_FRAMES: Frame[] = [
  f(`
     ~~~
    /o o\\
   | (_) |
    \\___/
    /| |\\
   ~     ~
`),
  f(`
     ~~~
    /^ ^\\
   | (_) |
    \\___/
    /| |\\
   ~     ~
`),
];

const DEAD_FRAMES: Frame[] = [
  f(`
    _____
   /  x  \\
  |  x x  |
   \\__~__/
    R.I.P.
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
