import { db } from "@/db/client";
import { battles, battleTurns, creatures, events, tiles, users } from "@/db/schema";
import { and, asc, desc, eq, gte, or } from "drizzle-orm";
import {
  applyMove,
  isOver,
  maxHpFor,
  type Combatant,
} from "./battle-engine";
import { availableSkills, getSkill } from "./battle-skills";
import { canAttackerReach } from "./reachability";

export const BATTLE_PAIR_COOLDOWN_MS = 60 * 60 * 1000;

export interface BattleSnapshot {
  id: string;
  state: "active" | "ended";
  turnNo: number;
  turnOwnerUserId: string | null;
  startedAt: string;
  endedAt: string | null;
  winnerUserId: string | null;
  attacker: BattleParticipantView;
  defender: BattleParticipantView;
  log: BattleTurnView[];
}

export interface BattleParticipantView {
  userId: string;
  username: string | null;
  image: string | null;
  creatureId: string;
  creatureName: string;
  klass: string | null;
  hp: number;
  maxHp: number;
  cooldowns: Record<string, number>;
  skills: Array<{ id: string; name: string; cooldown: number; description: string; ultimate: boolean; remainingCd: number }>;
}

export interface BattleTurnView {
  turnNo: number;
  actorUserId: string;
  skillId: string;
  damage: number;
  heal: number;
  crit: boolean;
  log: string;
  attackerHpAfter: number;
  defenderHpAfter: number;
}

function statsOf(c: { str: number; intStat: number; dex: number }) {
  return { str: c.str, int: c.intStat, dex: c.dex };
}

export async function startBattle(args: {
  attackerUserId: string;
  defenderUserId: string;
  tileX: number;
  tileY: number;
}): Promise<{ battleId: string } | { error: string }> {
  const { attackerUserId, defenderUserId, tileX, tileY } = args;
  if (attackerUserId === defenderUserId) return { error: "cannot battle yourself" };

  const [tileRow] = await db
    .select({ ownerUserId: tiles.ownerUserId })
    .from(tiles)
    .where(and(eq(tiles.x, tileX), eq(tiles.y, tileY)))
    .limit(1);
  if (!tileRow) return { error: "tile does not exist" };
  if (tileRow.ownerUserId !== defenderUserId) return { error: "defender no longer owns this tile" };

  const reachable = await canAttackerReach(attackerUserId, tileX, tileY);
  if (!reachable) return { error: "tile not within reach of any of your bases" };

  const cooldownSince = new Date(Date.now() - BATTLE_PAIR_COOLDOWN_MS);
  const [recent] = await db
    .select({ state: battles.state, endedAt: battles.endedAt })
    .from(battles)
    .where(
      and(
        or(
          and(eq(battles.attackerUserId, attackerUserId), eq(battles.defenderUserId, defenderUserId)),
          and(eq(battles.attackerUserId, defenderUserId), eq(battles.defenderUserId, attackerUserId)),
        ),
        gte(battles.startedAt, cooldownSince),
      ),
    )
    .orderBy(desc(battles.startedAt))
    .limit(1);
  if (recent) {
    if (recent.state === "active") return { error: "you already have an active battle with this player" };
    return { error: "this matchup is on cooldown — try again later" };
  }

  const [attackerCreature] = await db
    .select()
    .from(creatures)
    .where(and(eq(creatures.userId, attackerUserId), eq(creatures.active, true)))
    .limit(1);

  const [defenderCreature] = await db
    .select()
    .from(creatures)
    .where(and(eq(creatures.userId, defenderUserId), eq(creatures.active, true)))
    .limit(1);

  if (!attackerCreature) return { error: "you have no active creature" };
  if (!defenderCreature) return { error: "defender has no active creature" };

  const attackerStats = statsOf(attackerCreature);
  const defenderStats = statsOf(defenderCreature);
  const attackerHp = maxHpFor(attackerStats);
  const defenderHp = maxHpFor(defenderStats);

  const [created] = await db
    .insert(battles)
    .values({
      attackerUserId,
      defenderUserId,
      attackerCreatureId: attackerCreature.id,
      defenderCreatureId: defenderCreature.id,
      state: "active",
      turnOwnerUserId: defenderUserId,
      turnNo: 0,
      attackerHp,
      attackerMaxHp: attackerHp,
      defenderHp,
      defenderMaxHp: defenderHp,
      attackerCooldowns: "{}",
      defenderCooldowns: "{}",
      challengedTileX: tileX,
      challengedTileY: tileY,
      tileCaptured: false,
    })
    .returning({ id: battles.id });

  if (!created) return { error: "failed to create battle" };
  return { battleId: created.id };
}

export async function getBattleSnapshot(battleId: string): Promise<BattleSnapshot | null> {
  const [b] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!b) return null;

  const [attackerCreature] = await db.select().from(creatures).where(eq(creatures.id, b.attackerCreatureId)).limit(1);
  const [defenderCreature] = await db.select().from(creatures).where(eq(creatures.id, b.defenderCreatureId)).limit(1);
  const [attackerUser] = await db.select().from(users).where(eq(users.id, b.attackerUserId)).limit(1);
  const [defenderUser] = await db.select().from(users).where(eq(users.id, b.defenderUserId)).limit(1);

  const turns = await db
    .select()
    .from(battleTurns)
    .where(eq(battleTurns.battleId, battleId))
    .orderBy(asc(battleTurns.turnNo));

  const attackerCd = JSON.parse(b.attackerCooldowns) as Record<string, number>;
  const defenderCd = JSON.parse(b.defenderCooldowns) as Record<string, number>;

  return {
    id: b.id,
    state: b.state as "active" | "ended",
    turnNo: b.turnNo,
    turnOwnerUserId: b.turnOwnerUserId,
    startedAt: b.startedAt.toISOString(),
    endedAt: b.endedAt?.toISOString() ?? null,
    winnerUserId: b.winnerUserId,
    attacker: participantView(
      b.attackerUserId,
      attackerUser?.name ?? null,
      attackerUser?.image ?? null,
      attackerCreature?.id ?? "",
      attackerCreature?.name ?? "?",
      attackerCreature?.klass ?? null,
      b.attackerHp,
      b.attackerMaxHp,
      attackerCd,
    ),
    defender: participantView(
      b.defenderUserId,
      defenderUser?.name ?? null,
      defenderUser?.image ?? null,
      defenderCreature?.id ?? "",
      defenderCreature?.name ?? "?",
      defenderCreature?.klass ?? null,
      b.defenderHp,
      b.defenderMaxHp,
      defenderCd,
    ),
    log: turns.map((t) => ({
      turnNo: t.turnNo,
      actorUserId: t.actorUserId,
      skillId: t.skillId,
      damage: t.damage,
      heal: t.heal,
      crit: t.crit,
      log: t.log,
      attackerHpAfter: t.attackerHpAfter,
      defenderHpAfter: t.defenderHpAfter,
    })),
  };
}

function participantView(
  userId: string,
  name: string | null,
  image: string | null,
  creatureId: string,
  creatureName: string,
  klass: string | null,
  hp: number,
  maxHp: number,
  cooldowns: Record<string, number>,
): BattleParticipantView {
  const skills = availableSkills(klass).map((s) => ({
    id: s.id,
    name: s.name,
    cooldown: s.cooldown,
    description: s.description,
    ultimate: s.ultimate,
    remainingCd: cooldowns[s.id] ?? 0,
  }));
  return { userId, username: name, image, creatureId, creatureName, klass, hp, maxHp, cooldowns, skills };
}

export async function submitMove(args: {
  battleId: string;
  actorUserId: string;
  skillId: string;
}): Promise<{ ok: true; captured: boolean } | { error: string }> {
  const { battleId, actorUserId, skillId } = args;
  const [b] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!b) return { error: "battle not found" };
  if (b.state !== "active") return { error: "battle has ended" };
  if (b.turnOwnerUserId !== actorUserId) return { error: "not your turn" };

  const [attackerCreature] = await db.select().from(creatures).where(eq(creatures.id, b.attackerCreatureId)).limit(1);
  const [defenderCreature] = await db.select().from(creatures).where(eq(creatures.id, b.defenderCreatureId)).limit(1);
  if (!attackerCreature || !defenderCreature) return { error: "creature gone" };

  const isAttackerTurn = actorUserId === b.attackerUserId;
  const actorCreature = isAttackerTurn ? attackerCreature : defenderCreature;
  const skill = getSkill(actorCreature.klass, skillId);
  if (!skill) return { error: "unknown skill" };

  const attackerCdMap = JSON.parse(b.attackerCooldowns) as Record<string, number>;
  const defenderCdMap = JSON.parse(b.defenderCooldowns) as Record<string, number>;

  const attackerCombatant: Combatant = {
    userId: b.attackerUserId,
    creatureId: b.attackerCreatureId,
    name: attackerCreature.name,
    klass: attackerCreature.klass,
    stats: statsOf(attackerCreature),
    hp: b.attackerHp,
    maxHp: b.attackerMaxHp,
    cooldowns: attackerCdMap,
  };

  const defenderCombatant: Combatant = {
    userId: b.defenderUserId,
    creatureId: b.defenderCreatureId,
    name: defenderCreature.name,
    klass: defenderCreature.klass,
    stats: statsOf(defenderCreature),
    hp: b.defenderHp,
    maxHp: b.defenderMaxHp,
    cooldowns: defenderCdMap,
  };

  const me = isAttackerTurn ? attackerCombatant : defenderCombatant;
  const them = isAttackerTurn ? defenderCombatant : attackerCombatant;

  if ((me.cooldowns[skill.id] ?? 0) > 0) return { error: "skill on cooldown" };

  const result = applyMove(me, them, skill);
  const nextAttacker = isAttackerTurn ? result.attacker : result.defender;
  const nextDefender = isAttackerTurn ? result.defender : result.attacker;

  const winner = isOver(nextAttacker, nextDefender);
  const ended = winner !== null;
  const winnerUserId = winner === "attacker" ? b.attackerUserId : winner === "defender" ? b.defenderUserId : null;

  const nextTurnNo = b.turnNo + 1;
  const nextTurnOwner = ended ? null : isAttackerTurn ? b.defenderUserId : b.attackerUserId;

  let captured = false;
  await db.transaction(async (tx) => {
    await tx
      .update(battles)
      .set({
        attackerHp: nextAttacker.hp,
        defenderHp: nextDefender.hp,
        attackerCooldowns: JSON.stringify(nextAttacker.cooldowns),
        defenderCooldowns: JSON.stringify(nextDefender.cooldowns),
        turnNo: nextTurnNo,
        turnOwnerUserId: nextTurnOwner,
        state: ended ? "ended" : "active",
        endedAt: ended ? new Date() : null,
        winnerUserId,
        lastMoveAt: new Date(),
      })
      .where(eq(battles.id, battleId));

    await tx.insert(battleTurns).values({
      battleId,
      turnNo: nextTurnNo,
      actorUserId,
      skillId: skill.id,
      damage: result.damage,
      heal: result.heal,
      crit: result.crit,
      attackerHpAfter: nextAttacker.hp,
      defenderHpAfter: nextDefender.hp,
      log: result.log,
    });

    if (ended && winnerUserId === b.attackerUserId) {
      const updated = await tx
        .update(tiles)
        .set({
          ownerUserId: b.attackerUserId,
          baseCreatureId: b.attackerCreatureId,
          acquiredAt: new Date(),
        })
        .where(
          and(
            eq(tiles.x, b.challengedTileX),
            eq(tiles.y, b.challengedTileY),
            eq(tiles.ownerUserId, b.defenderUserId),
          ),
        )
        .returning({ id: tiles.id });
      if (updated.length > 0) {
        captured = true;
        await tx.update(battles).set({ tileCaptured: true }).where(eq(battles.id, battleId));
        await tx.insert(events).values({
          userId: b.defenderUserId,
          kind: "tile_lost",
          payload: JSON.stringify({
            x: b.challengedTileX,
            y: b.challengedTileY,
            attackerUserId: b.attackerUserId,
            attackerName: attackerCreature.name,
            battleId,
          }),
        });
      }
    }
  });

  return { ok: true, captured };
}
