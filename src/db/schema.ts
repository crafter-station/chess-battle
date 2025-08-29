import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const defaultUserId = "user_web";

export const battle = pgTable("battle", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().default(defaultUserId),

  white_player_id: text("white_player_id").notNull(),
  black_player_id: text("black_player_id").notNull(),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type BattleSelect = typeof battle.$inferSelect;

export const move = pgTable("move", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().default(defaultUserId),
  battle_d: text("battle_id")
    .notNull()
    .references(() => battle.id),
  player_id: text("player_id")
    .notNull()
    .references(() => player.id),

  move: text("move").notNull(),
  // State after the move is applied, FEN string.
  // If the move is invalid, the state is the same as the previous state.
  state: text("state").notNull(),
  is_valid: boolean("is_valid").notNull(),

  tokens_in: integer("tokens_in"),
  tokens_out: integer("tokens_out"),

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

export type AiModelSelect = typeof ai_model.$inferSelect;
