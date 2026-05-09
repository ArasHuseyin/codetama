import { pgTable, text, timestamp, primaryKey, integer, boolean, unique } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  streakDays: integer("streak_days").notNull().default(0),
  streakLongest: integer("streak_longest").notNull().default(0),
  streakLastDay: text("streak_last_day"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const cliTokens = pgTable("cli_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hashedToken: text("hashed_token").notNull().unique(),
  prefix: text("prefix").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  revoked: boolean("revoked").notNull().default(false),
});

export const creatures = pgTable("creatures", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  stage: text("stage").notNull(),
  klass: text("klass"),
  str: integer("str").notNull().default(1),
  intStat: integer("int_stat").notNull().default(1),
  dex: integer("dex").notNull().default(1),
  hunger: integer("hunger").notNull().default(50),
  promptsTotal: integer("prompts_total").notNull().default(0),
  promptsThisStage: integer("prompts_this_stage").notNull().default(0),
  bornAt: timestamp("born_at").notNull().defaultNow(),
  lastFedAt: timestamp("last_fed_at").notNull().defaultNow(),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  diedAt: timestamp("died_at"),
  rebirths: integer("rebirths").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const tiles = pgTable(
  "tiles",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    baseCreatureId: text("base_creature_id").references(() => creatures.id, { onDelete: "set null" }),
    acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
  },
  (t) => [unique("tiles_xy_unique").on(t.x, t.y)],
);

export const battles = pgTable("battles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  attackerUserId: text("attacker_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  defenderUserId: text("defender_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  attackerCreatureId: text("attacker_creature_id")
    .notNull()
    .references(() => creatures.id, { onDelete: "cascade" }),
  defenderCreatureId: text("defender_creature_id")
    .notNull()
    .references(() => creatures.id, { onDelete: "cascade" }),
  state: text("state").notNull(), // "pending" | "active" | "ended"
  turnOwnerUserId: text("turn_owner_user_id"),
  turnNo: integer("turn_no").notNull().default(0),
  challengedTileX: integer("challenged_tile_x").notNull(),
  challengedTileY: integer("challenged_tile_y").notNull(),
  tileCaptured: boolean("tile_captured").notNull().default(false),
  attackerHp: integer("attacker_hp").notNull(),
  attackerMaxHp: integer("attacker_max_hp").notNull(),
  defenderHp: integer("defender_hp").notNull(),
  defenderMaxHp: integer("defender_max_hp").notNull(),
  attackerCooldowns: text("attacker_cooldowns").notNull().default("{}"),
  defenderCooldowns: text("defender_cooldowns").notNull().default("{}"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  winnerUserId: text("winner_user_id"),
  lastMoveAt: timestamp("last_move_at").notNull().defaultNow(),
});

export const battleTurns = pgTable("battle_turns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  battleId: text("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  turnNo: integer("turn_no").notNull(),
  actorUserId: text("actor_user_id").notNull(),
  skillId: text("skill_id").notNull(),
  damage: integer("damage").notNull().default(0),
  heal: integer("heal").notNull().default(0),
  crit: boolean("crit").notNull().default(false),
  attackerHpAfter: integer("attacker_hp_after").notNull(),
  defenderHpAfter: integer("defender_hp_after").notNull(),
  log: text("log").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

export type User = typeof users.$inferSelect;
export type CliToken = typeof cliTokens.$inferSelect;
export type Creature = typeof creatures.$inferSelect;
export type Tile = typeof tiles.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type BattleTurn = typeof battleTurns.$inferSelect;
