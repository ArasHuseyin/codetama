import { describe, it, expect } from "vitest";
import {
  applyMove,
  computeDamage,
  critChance,
  isOnCooldown,
  isOver,
  maxHpFor,
  type Combatant,
} from "./battle-engine";
import { SKILLS, getSkill } from "./battle-skills";

function combatant(overrides: Partial<Combatant> = {}): Combatant {
  const stats = overrides.stats ?? { str: 10, int: 10, dex: 10 };
  return {
    userId: "u1",
    creatureId: "c1",
    name: "Test",
    klass: "warrior",
    stats,
    hp: maxHpFor(stats),
    maxHp: maxHpFor(stats),
    cooldowns: {},
    ...overrides,
  };
}

describe("maxHpFor", () => {
  it("100 + STR×5 + LV×10", () => {
    expect(maxHpFor({ str: 10, int: 10, dex: 10 })).toBe(100 + 50 + 300);
  });

  it("scales with STR strongly", () => {
    const a = maxHpFor({ str: 1, int: 1, dex: 1 });
    const b = maxHpFor({ str: 10, int: 1, dex: 1 });
    // STR delta 9 → +9*5 (str bonus) + +9*10 (level bonus) = 135
    expect(b - a).toBe(135);
  });
});

describe("critChance", () => {
  it("base 5% + DEX/4", () => {
    expect(critChance(0, 0)).toBe(5);
    expect(critChance(20, 0)).toBe(10);
  });

  it("capped at 50", () => {
    expect(critChance(1000, 50)).toBe(50);
  });

  it("adds skill bonus", () => {
    expect(critChance(0, 20)).toBe(25);
  });
});

describe("computeDamage", () => {
  it("base damage scales with attacker stat", () => {
    const skill = getSkill("warrior", "slash")!;
    const low = computeDamage({ str: 1, int: 1, dex: 1 }, { str: 1, int: 1, dex: 1 }, skill, false);
    const high = computeDamage({ str: 60, int: 1, dex: 1 }, { str: 1, int: 1, dex: 1 }, skill, false);
    expect(high).toBeGreaterThan(low * 2);
  });

  it("DEX defense reduces damage", () => {
    const skill = getSkill("warrior", "slash")!;
    const noDefense = computeDamage({ str: 10, int: 1, dex: 1 }, { str: 1, int: 1, dex: 1 }, skill, false);
    const heavyDefense = computeDamage({ str: 10, int: 1, dex: 1 }, { str: 1, int: 1, dex: 100 }, skill, false);
    expect(heavyDefense).toBeLessThan(noDefense);
  });

  it("DEX defense cannot reduce below 20%", () => {
    const skill = getSkill("warrior", "slash")!;
    const dmg = computeDamage({ str: 10, int: 1, dex: 1 }, { str: 1, int: 1, dex: 10000 }, skill, false);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it("crit roughly doubles damage", () => {
    const skill = getSkill("warrior", "slash")!;
    const normal = computeDamage({ str: 10, int: 1, dex: 1 }, { str: 1, int: 1, dex: 1 }, skill, false);
    const crit = computeDamage({ str: 10, int: 1, dex: 1 }, { str: 1, int: 1, dex: 1 }, skill, true);
    expect(crit).toBeGreaterThanOrEqual(normal * 2 - 1);
    expect(crit).toBeLessThanOrEqual(normal * 2 + 1);
  });
});

describe("applyMove", () => {
  it("damage skill reduces defender HP", () => {
    const a = combatant({ stats: { str: 30, int: 1, dex: 1 } });
    const b = combatant({ stats: { str: 10, int: 10, dex: 10 } });
    const r = applyMove(a, b, getSkill("warrior", "slash")!, { next: () => 0.99 });
    expect(r.defender.hp).toBeLessThan(b.hp);
    expect(r.damage).toBeGreaterThan(0);
  });

  it("heal skill restores HP", () => {
    const c = combatant({ klass: "sage", stats: { str: 1, int: 30, dex: 1 } });
    const wounded = { ...c, hp: 50 };
    const opponent = combatant();
    const r = applyMove(wounded, opponent, getSkill("sage", "soothe")!, { next: () => 0.99 });
    expect(r.attacker.hp).toBeGreaterThan(50);
    expect(r.heal).toBeGreaterThan(0);
  });

  it("heal does not exceed maxHp", () => {
    const c = combatant({ klass: "sage", stats: { str: 1, int: 1000, dex: 1 } });
    const r = applyMove(c, combatant(), getSkill("sage", "soothe")!, { next: () => 0.99 });
    expect(r.attacker.hp).toBeLessThanOrEqual(c.maxHp);
  });

  it("sets cooldown after using skill", () => {
    const a = combatant();
    const skill = getSkill("warrior", "cleave")!;
    const r = applyMove(a, combatant(), skill, { next: () => 0.99 });
    expect(r.attacker.cooldowns["cleave"]).toBe(skill.cooldown);
  });

  it("decrements existing cooldowns", () => {
    const a = combatant({ cooldowns: { cleave: 2 } });
    const r = applyMove(a, combatant(), getSkill("warrior", "slash")!, { next: () => 0.99 });
    expect(r.attacker.cooldowns["cleave"]).toBe(1);
  });

  it("crit when rng below threshold", () => {
    const a = combatant({ stats: { str: 30, int: 1, dex: 50 } });
    const r = applyMove(a, combatant(), getSkill("warrior", "slash")!, { next: () => 0 });
    expect(r.crit).toBe(true);
  });

  it("equilibrium does damage and heals 50% missing", () => {
    const a = combatant({ klass: "druid", stats: { str: 10, int: 10, dex: 10 } });
    const wounded = { ...a, hp: a.maxHp - 100 };
    const r = applyMove(wounded, combatant(), getSkill("druid", "equilibrium")!, { next: () => 0.99 });
    expect(r.damage).toBeGreaterThan(0);
    expect(r.heal).toBe(50);
    expect(r.attacker.hp).toBe(wounded.hp + 50);
  });
});

describe("isOver", () => {
  it("returns null when both alive", () => {
    expect(isOver(combatant({ hp: 100 }), combatant({ hp: 100 }))).toBeNull();
  });

  it("returns attacker when defender dies", () => {
    expect(isOver(combatant({ hp: 100 }), combatant({ hp: 0 }))).toBe("attacker");
  });

  it("returns defender when attacker dies", () => {
    expect(isOver(combatant({ hp: 0 }), combatant({ hp: 100 }))).toBe("defender");
  });
});

describe("isOnCooldown", () => {
  it("true when cooldown > 0", () => {
    expect(isOnCooldown(combatant({ cooldowns: { x: 1 } }), "x")).toBe(true);
  });
  it("false when cooldown 0 or missing", () => {
    expect(isOnCooldown(combatant(), "x")).toBe(false);
  });
});

describe("skill metadata", () => {
  it("each class has 4 skills, last is ultimate", () => {
    for (const family of ["warrior", "sage", "trickster", "balanced"] as const) {
      const skills = SKILLS[family];
      expect(skills).toHaveLength(4);
      expect(skills[3]?.ultimate).toBe(true);
      expect(skills.slice(0, 3).every((s) => !s.ultimate)).toBe(true);
    }
  });
});
