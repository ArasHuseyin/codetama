// Four sprite styles, four classes each — for visual comparison.

export interface ClassSprite {
  name: string;
  art: string;
}

// ─── Variant 1: bigger creatures with bodies ─────────────────────────

export const V1_BIGGER: ClassSprite[] = [
  {
    name: "WARRIOR",
    art: `   ▄▄▄▄▄▄▄
  █ ◉   ◉ █
  █   □   █
   ▀█▀▀▀█▀
   ▐█████▌
   ▐█████▌
   ╱     ╲
  ╱─╲   ╱─╲`,
  },
  {
    name: "SAGE",
    art: `    . ✦ .
    ▄▄▄▄▄
   /◉   ◉\\
   |  ‿  |
    \\___/
     │ │
    ╱│ │╲
   *  │  *`,
  },
  {
    name: "TRICKSTER",
    art: `   ╱╲   ╱╲
  ╱  ◉ ◉  ╲
  ╲   ʌ   ╱
   ╲_____╱
    │ │ │
    ╲   ╱
   ╱─╲ ╱─╲
   `,
  },
  {
    name: "BALANCED",
    art: `   ▄▀▀▀▄
  ▐ ◉ ◉ ▌
  ▐  ◇  ▌
   ▀▄▄▄▀
    │ │
    │ │
   ╱   ╲
  ╱─╲ ╱─╲`,
  },
];

// ─── Variant 2: class-themed redesign ────────────────────────────────

export const V2_THEMED: ClassSprite[] = [
  {
    name: "WARRIOR",
    art: `    ╲╲ ╱╱
   ▕━━━━━▏      <- helm + horns
   ▕◉   ◉▏
   ▕  ╳  ▏
    ▔▔▔▔▔
    ▐███▌
   ⚔  ⚓  ⚔`,
  },
  {
    name: "SAGE",
    art: `    ✦   ✦
     ✿
   ╱ ◉ ◉ ╲
   ╲  ‿  ╱
    │∞∞∞│
   ╱─────╲
    ✧ ✧ ✧`,
  },
  {
    name: "TRICKSTER",
    art: `   ╲▔╱╲▔╱
  ╱  ◑ ◑  ╲      <- mask + ears
  ╲   ─   ╱
   ╲▁▁▁▁▁╱
    │ │ │
   ⚔━━━⚔
    ╱ ╲`,
  },
  {
    name: "BALANCED",
    art: `   ┌◐──◑┐
   │ ◉  ◉ │      <- 4 elements halo
   │  ◇   │
    ╲___╱
   ⊙  ╳  ⊙
    ╱   ╲
   △ □ ○ ▽`,
  },
];

// ─── Variant 3: minimal upgrade — same shape, sharper chars + aura ───
// Same silhouettes as current but with refined Unicode chars.
// Aura/glow ring will be CSS, sprites stay close to current size.

export const V3_AURA: ClassSprite[] = [
  {
    name: "WARRIOR",
    art: `   ╭─◉─◉─╮
   │  □   │
   ╰──┬──╯
    ▕━┻━▏
    ▕   ▏`,
  },
  {
    name: "SAGE",
    art: `    ╭───╮
   ╱◉   ◉╲
   ╲  ‿  ╱
    ╰─┬─╯
    ╱─┴─╲`,
  },
  {
    name: "TRICKSTER",
    art: `   ╱╲ ╱╲
  ⟨ ◉.◉ ⟩
   ╲ ʌ ╱
   ▕┃▕┃▏
   ╱│ │╲`,
  },
  {
    name: "BALANCED",
    art: `    ╭─╮
   ╱◉ ◉╲
   │ ◇ │
    ╲┬╱
   ╱─┴─╲`,
  },
];

// ─── Variant 4: SVG pixel sprites (rendered separately) ──────────────
// SVG sprites are defined in a component, not as ASCII. Below are
// labels referenced by the page; rendering uses inline SVG.

export const V4_SVG_NAMES = ["WARRIOR", "SAGE", "TRICKSTER", "BALANCED"] as const;

// ─── Variant 7: tarot-card framed portraits ──────────────────────────

export interface TarotCard {
  name: string;
  numeral: string;
  motto: string;
  art: string;
}

export const V7_TAROT: TarotCard[] = [
  {
    name: "WARRIOR",
    numeral: "I",
    motto: "the strike",
    art: `   ╲   ╱
    ╳
   ╱ ╲
  ◉ □ ◉
   ─┬─
   /│\\
   ╱─╲`,
  },
  {
    name: "SAGE",
    numeral: "II",
    motto: "the watcher",
    art: `  ✦   ✦
   ───
  /◉ ◉\\
  | ⌣ |
   ╲_╱
    ║
   ✧╳✧`,
  },
  {
    name: "TRICKSTER",
    numeral: "III",
    motto: "the blade",
    art: `   ╱╲╱╲
   ◑ ◑
    ─
  ╲▁▁▁╱
   │ │
   │ │
  ⚔ ─ ⚔`,
  },
  {
    name: "BALANCED",
    numeral: "IV",
    motto: "the four",
    art: `    ✿
   ───
  /◉ ◉\\
  | ◇ |
   ╲_╱
   △□
   ○▽`,
  },
];
