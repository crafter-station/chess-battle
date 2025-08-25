import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const battle = pgTable("battle", {
  id: text("id").primaryKey(),

  whitePlayerModelId: text("white_player_model_id").notNull(),
  blackPlayerModelId: text("black_player_model_id").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const move = pgTable("move", {
  id: text("id").primaryKey(),
  battleId: text("battle_id")
    .notNull()
    .references(() => battle.id),
  playerId: text("player_id")
    .notNull()
    .references(() => player.id),

  move: text("move").notNull(),
  // State after the move is applied, FEN string.
  // If the move is invalid, the state is the same as the previous state.
  state: text("state").notNull(),
  isValid: boolean("is_valid").notNull(),

  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const player = pgTable("player", {
  id: text("id").primaryKey(),

  modelId: text("model_id").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});
