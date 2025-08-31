import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const defaultUserId = "user_web";

export const BattleOutcomeEnum = pgEnum("battle_outcome_enum", ["win", "draw"]);
export const PlayerEnum = pgEnum("player_enum", ["white", "black"]);

export const battle = pgTable("battle", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().default(defaultUserId),
  tournament_id: text("tournament_id").references(() => tournament.id),

  tournament_round: integer("tournament_round"),
  tournament_round_position: integer("tournament_round_position"),

  white_player_id: text("white_player_id")
    .notNull()
    .references(() => player.id),
  black_player_id: text("black_player_id")
    .notNull()
    .references(() => player.id),

  winner: PlayerEnum("winner"),
  outcome: BattleOutcomeEnum("outcome"),
  game_end_reason: text("game_end_reason"),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type BattleSelect = typeof battle.$inferSelect;

export const move = pgTable("move", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().default(defaultUserId),
  battle_id: text("battle_id")
    .notNull()
    .references(() => battle.id),
  player_id: text("player_id")
    .notNull()
    .references(() => player.id),

  move: text("move"),
  // State after the move is applied, FEN string.
  // If the move is invalid, the state is the same as the previous state.
  state: text("state").notNull(),
  is_valid: boolean("is_valid").notNull(),

  tokens_in: integer("tokens_in"),
  tokens_out: integer("tokens_out"),
  response_time: integer("response_time"),
  raw_response: text("raw_response"),

  confidence: integer("confidence"),
  reasoning: text("reasoning"),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type MoveSelect = typeof move.$inferSelect;

export const player = pgTable("player", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().default(defaultUserId),

  model_id: text("model_id").notNull(),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type PlayerSelect = typeof player.$inferSelect;
export type PlayerInsert = typeof player.$inferInsert;

export const tournament = pgTable("tournament", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().default(defaultUserId),

  name: text("name").notNull(),
  description: text("description"),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type TournamentSelect = typeof tournament.$inferSelect;

export const playerRelations = relations(player, ({ many }) => ({
  battles: many(battle),
  moves: many(move),
}));

export const moveRelations = relations(move, ({ one }) => ({
  battle: one(battle, {
    fields: [move.battle_id],
    references: [battle.id],
  }),
  player: one(player, {
    fields: [move.player_id],
    references: [player.id],
  }),
}));

export const battleRelations = relations(battle, ({ one, many }) => ({
  tournament: one(tournament, {
    fields: [battle.tournament_id],
    references: [tournament.id],
  }),
  moves: many(move),
  whitePlayer: one(player, {
    fields: [battle.white_player_id],
    references: [player.id],
  }),
  blackPlayer: one(player, {
    fields: [battle.black_player_id],
    references: [player.id],
  }),
}));

export const tournamentRelations = relations(tournament, ({ many }) => ({
  battles: many(battle),
}));

// Simple model catalog for AI Gateway models
export const ai_model = pgTable("ai_model", {
  id: text("id").primaryKey(),
  // e.g. "anthropic/claude-sonnet-4"
  canonical_id: text("canonical_id").notNull().unique(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  // First logo URL if available
  logo_url: text("logo_url"),
  // The public model details page on Vercel AI Gateway
  models_url: text("models_url"),
  chat_url: text("chat_url"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export type AIModelSelect = typeof ai_model.$inferSelect;
