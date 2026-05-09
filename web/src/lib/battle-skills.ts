export type ScalingStat = "str" | "int" | "dex" | "avg";
export type SkillKind = "damage" | "heal" | "hybrid";
export type ClassFamily = "warrior" | "sage" | "trickster" | "balanced";
export type ElderSubform = "warlord" | "archmage" | "shadow" | "druid";

export interface Skill {
  id: string;
  name: string;
  kind: SkillKind;
  base: number;
  scaling: ScalingStat;
  cooldown: number;
  critBonus: number;
  description: string;
  ultimate: boolean;
}

export const SKILLS: Record<ClassFamily, Skill[]> = {
  warrior: [
    {
      id: "slash",
      name: "Slash",
      kind: "damage",
      base: 30,
      scaling: "str",
      cooldown: 0,
      critBonus: 0,
      description: "A clean blade strike. STR-scaled.",
      ultimate: false,
    },
    {
      id: "cleave",
      name: "Cleave",
      kind: "damage",
      base: 50,
      scaling: "str",
      cooldown: 1,
      critBonus: 0,
      description: "Wide arcing swing. STR-heavy, 1-turn cooldown.",
      ultimate: false,
    },
    {
      id: "onslaught",
      name: "Onslaught",
      kind: "damage",
      base: 80,
      scaling: "str",
      cooldown: 2,
      critBonus: 5,
      description: "Brutal combo. Big STR damage, +5% crit, 2-turn cooldown.",
      ultimate: false,
    },
    {
      id: "devastate",
      name: "Devastate",
      kind: "damage",
      base: 130,
      scaling: "str",
      cooldown: 3,
      critBonus: 15,
      description: "Warlord ultimate. Crushing blow. Elder only.",
      ultimate: true,
    },
  ],
  sage: [
    {
      id: "bolt",
      name: "Arcane Bolt",
      kind: "damage",
      base: 30,
      scaling: "int",
      cooldown: 0,
      critBonus: 0,
      description: "A magic dart. INT-scaled.",
      ultimate: false,
    },
    {
      id: "soothe",
      name: "Soothe",
      kind: "heal",
      base: 40,
      scaling: "int",
      cooldown: 1,
      critBonus: 0,
      description: "Restore HP. INT-scaled, 1-turn cooldown.",
      ultimate: false,
    },
    {
      id: "tempest",
      name: "Tempest",
      kind: "damage",
      base: 75,
      scaling: "int",
      cooldown: 2,
      critBonus: 0,
      description: "Storm of magic. Big INT damage, 2-turn cooldown.",
      ultimate: false,
    },
    {
      id: "cataclysm",
      name: "Cataclysm",
      kind: "damage",
      base: 140,
      scaling: "int",
      cooldown: 3,
      critBonus: 0,
      description: "Archmage ultimate. World-ending magic. Elder only.",
      ultimate: true,
    },
  ],
  trickster: [
    {
      id: "jab",
      name: "Jab",
      kind: "damage",
      base: 25,
      scaling: "dex",
      cooldown: 0,
      critBonus: 10,
      description: "Quick strike. DEX-scaled, +10% crit.",
      ultimate: false,
    },
    {
      id: "trick",
      name: "Trick Shot",
      kind: "damage",
      base: 45,
      scaling: "dex",
      cooldown: 1,
      critBonus: 20,
      description: "Sneaky precision. DEX-scaled, +20% crit, 1-turn cooldown.",
      ultimate: false,
    },
    {
      id: "vanish",
      name: "Vanish Strike",
      kind: "damage",
      base: 65,
      scaling: "dex",
      cooldown: 2,
      critBonus: 35,
      description: "Disappear and strike. DEX-scaled, +35% crit, 2-turn cooldown.",
      ultimate: false,
    },
    {
      id: "assassinate",
      name: "Assassinate",
      kind: "damage",
      base: 110,
      scaling: "dex",
      cooldown: 3,
      critBonus: 50,
      description: "Shadow ultimate. Almost guaranteed crit. Elder only.",
      ultimate: true,
    },
  ],
  balanced: [
    {
      id: "tap",
      name: "Tap",
      kind: "damage",
      base: 30,
      scaling: "avg",
      cooldown: 0,
      critBonus: 0,
      description: "Balanced strike. Uses average of all stats.",
      ultimate: false,
    },
    {
      id: "steady",
      name: "Steady Hand",
      kind: "heal",
      base: 30,
      scaling: "avg",
      cooldown: 1,
      critBonus: 0,
      description: "Self-heal. Balanced-scaled, 1-turn cooldown.",
      ultimate: false,
    },
    {
      id: "surge",
      name: "Surge",
      kind: "damage",
      base: 65,
      scaling: "avg",
      cooldown: 2,
      critBonus: 0,
      description: "Channel all energies. Balanced-scaled damage, 2-turn cooldown.",
      ultimate: false,
    },
    {
      id: "equilibrium",
      name: "Equilibrium",
      kind: "hybrid",
      base: 90,
      scaling: "avg",
      cooldown: 3,
      critBonus: 0,
      description: "Druid ultimate. Damage + self-heal of 50%. Elder only.",
      ultimate: true,
    },
  ],
};

export const ELDER_TO_FAMILY: Record<ElderSubform, ClassFamily> = {
  warlord: "warrior",
  archmage: "sage",
  shadow: "trickster",
  druid: "balanced",
};

export function familyOf(klass: string | null): ClassFamily | null {
  if (!klass) return null;
  if (klass === "warrior" || klass === "sage" || klass === "trickster" || klass === "balanced") {
    return klass;
  }
  if (klass === "warlord" || klass === "archmage" || klass === "shadow" || klass === "druid") {
    return ELDER_TO_FAMILY[klass];
  }
  return null;
}

export function isElderSubform(klass: string | null): boolean {
  return klass === "warlord" || klass === "archmage" || klass === "shadow" || klass === "druid";
}

export function availableSkills(klass: string | null): Skill[] {
  const family = familyOf(klass);
  if (!family) return [];
  const all = SKILLS[family];
  if (isElderSubform(klass)) return all;
  return all.filter((s) => !s.ultimate);
}

export function getSkill(klass: string | null, id: string): Skill | null {
  return availableSkills(klass).find((s) => s.id === id) ?? null;
}
