import { type Skill } from "./battle-skills";

export interface CombatStats {
  str: number;
  int: number;
  dex: number;
}

export interface Combatant {
  userId: string;
  creatureId: string;
  name: string;
  klass: string | null;
  stats: CombatStats;
  hp: number;
  maxHp: number;
  cooldowns: Record<string, number>;
}

export interface MoveResult {
  attacker: Combatant;
  defender: Combatant;
  damage: number;
  heal: number;
  crit: boolean;
  log: string;
}

export function maxHpFor(stats: CombatStats): number {
  const lv = stats.str + stats.int + stats.dex;
  return 100 + stats.str * 5 + lv * 10;
}

export function critChance(dex: number, skillBonus: number): number {
  return Math.min(50, 5 + Math.floor(dex / 4) + skillBonus);
}

function scalingValue(stats: CombatStats, scaling: Skill["scaling"]): number {
  switch (scaling) {
    case "str":
      return stats.str;
    case "int":
      return stats.int;
    case "dex":
      return stats.dex;
    case "avg":
      return Math.floor((stats.str + stats.int + stats.dex) / 3);
  }
}

export function computeDamage(
  attacker: CombatStats,
  defender: CombatStats,
  skill: Skill,
  isCrit: boolean,
): number {
  const stat = scalingValue(attacker, skill.scaling);
  const base = skill.base * (1 + stat / 30);
  const defenseFactor = 1 - defender.dex / 200;
  const dmg = base * Math.max(0.2, defenseFactor) * (isCrit ? 2 : 1);
  return Math.max(1, Math.floor(dmg));
}

export function computeHeal(stats: CombatStats, skill: Skill): number {
  const stat = scalingValue(stats, skill.scaling);
  return Math.max(1, Math.floor(skill.base * (1 + stat / 30)));
}

export interface RngSource {
  next(): number;
}

export const realRng: RngSource = { next: () => Math.random() };

export function rollCrit(dex: number, skillBonus: number, rng: RngSource = realRng): boolean {
  return rng.next() * 100 < critChance(dex, skillBonus);
}

export function applyMove(
  attacker: Combatant,
  defender: Combatant,
  skill: Skill,
  rng: RngSource = realRng,
): MoveResult {
  const next = {
    attacker: { ...attacker, cooldowns: { ...attacker.cooldowns } },
    defender: { ...defender, cooldowns: { ...defender.cooldowns } },
    damage: 0,
    heal: 0,
    crit: false,
    log: "",
  };

  // Tick down all cooldowns on attacker before applying skill (skill cd is set after).
  for (const key of Object.keys(next.attacker.cooldowns)) {
    next.attacker.cooldowns[key] = Math.max(0, (next.attacker.cooldowns[key] ?? 0) - 1);
  }

  if (skill.kind === "heal") {
    const heal = computeHeal(next.attacker.stats, skill);
    next.attacker.hp = Math.min(next.attacker.maxHp, next.attacker.hp + heal);
    next.heal = heal;
    next.log = `${next.attacker.name} casts ${skill.name} and recovers ${heal} HP.`;
  } else if (skill.kind === "hybrid") {
    const isCrit = rollCrit(next.attacker.stats.dex, skill.critBonus, rng);
    const dmg = computeDamage(next.attacker.stats, next.defender.stats, skill, isCrit);
    next.defender.hp = Math.max(0, next.defender.hp - dmg);
    const missing = next.attacker.maxHp - next.attacker.hp;
    const heal = Math.floor(missing * 0.5);
    next.attacker.hp = next.attacker.hp + heal;
    next.damage = dmg;
    next.heal = heal;
    next.crit = isCrit;
    next.log = `${next.attacker.name} unleashes ${skill.name}${isCrit ? " (CRIT!)" : ""}: ${dmg} damage, ${heal} self-heal.`;
  } else {
    const isCrit = rollCrit(next.attacker.stats.dex, skill.critBonus, rng);
    const dmg = computeDamage(next.attacker.stats, next.defender.stats, skill, isCrit);
    next.defender.hp = Math.max(0, next.defender.hp - dmg);
    next.damage = dmg;
    next.crit = isCrit;
    next.log = `${next.attacker.name} uses ${skill.name}${isCrit ? " (CRIT!)" : ""} for ${dmg} damage.`;
  }

  if (skill.cooldown > 0) {
    next.attacker.cooldowns[skill.id] = skill.cooldown;
  }

  return next;
}

export function isOver(a: Combatant, b: Combatant): "attacker" | "defender" | null {
  if (b.hp <= 0 && a.hp <= 0) return a.hp >= b.hp ? "attacker" : "defender";
  if (b.hp <= 0) return "attacker";
  if (a.hp <= 0) return "defender";
  return null;
}

export function isOnCooldown(c: Combatant, skillId: string): boolean {
  return (c.cooldowns[skillId] ?? 0) > 0;
}

/** Below this HP fraction the autoplayer prefers a ready heal over attacking. */
const AUTOPLAY_HEAL_BELOW = 0.35;

/**
 * Skill choice for auto-played turns. Pure random choice wasted heals at full
 * HP and ignored them when dying; this keeps the randomness for variety but
 * heals when low and never heals when (nearly) topped up.
 */
export function chooseAutoplaySkill(
  skills: Skill[],
  cooldowns: Record<string, number>,
  hp: number,
  maxHp: number,
  rng: RngSource = realRng,
): Skill | null {
  const ready = skills.filter((s) => (cooldowns[s.id] ?? 0) === 0);
  if (ready.length === 0) return skills.find((s) => s.cooldown === 0) ?? skills[0] ?? null;

  const heals = ready.filter((s) => s.kind === "heal");
  const offense = ready.filter((s) => s.kind !== "heal");
  if (heals.length > 0 && (offense.length === 0 || hp / maxHp < AUTOPLAY_HEAL_BELOW)) {
    return heals[Math.floor(rng.next() * heals.length)]!;
  }
  if (offense.length === 0) return ready[Math.floor(rng.next() * ready.length)]!;
  return offense[Math.floor(rng.next() * offense.length)]!;
}
