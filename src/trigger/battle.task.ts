import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { Chess } from "chess.js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

import { GetNextMoveTask } from "./get-next-move";

export const BattleTask = schemaTask({
  id: "battle",
  schema: z.object({
    battleId: z.string(),
    userId: z.string(),
    whitePlayerModelId: z.string(),
    blackPlayerModelId: z.string(),
  }),
  run: async (payload) => {
    const whitePlayerId = nanoid();
    const blackPlayerId = nanoid();

    await db.insert(schema.player).values({
      id: whitePlayerId,
      model_id: payload.whitePlayerModelId,
      user_id: payload.userId,
    });

    await db.insert(schema.player).values({
      id: blackPlayerId,
      model_id: payload.blackPlayerModelId,
      user_id: payload.userId,
    });

    await db.insert(schema.battle).values({
      id: payload.battleId,
      white_player_id: whitePlayerId,
      black_player_id: blackPlayerId,
      user_id: payload.userId,
    });

    const chess = new Chess();

    logger.info(
      `🏁 Starting chess battle: ${payload.whitePlayerModelId} vs ${payload.blackPlayerModelId} (Battle ID: ${payload.battleId})`
    );

    let lastInvalidMoves: string[] = [];

    while (true) {
      const moveNumber = Math.floor(chess.history().length / 2) + 1;
      const currentPlayer = chess.turn() === "w" ? "White" : "Black";

      const playerId = chess.turn() === "w" ? whitePlayerId : blackPlayerId;

      const nextMoveResult = await GetNextMoveTask.triggerAndWait({
        board: chess.fen(),
        whitePlayerModelId: payload.whitePlayerModelId,
        blackPlayerModelId: payload.blackPlayerModelId,
        lastInvalidMoves,
      });

      if (!nextMoveResult.ok) {
        throw new Error("Failed to get next move");
      }

      let isValid = true;

      try {
        chess.move(nextMoveResult.output.move);

        logger.info(
          `${currentPlayer} (Move ${moveNumber}): ${
            nextMoveResult.output.move
          } - Position: ${chess.fen().split(" ")[0]}`
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes("Invalid move")) {
          logger.error(
            `${currentPlayer} (Move ${moveNumber}): ❌ Invalid move "${nextMoveResult.output.move}" - ${error.message}. Retrying...`
          );
        } else {
          isValid = false;
          throw error;
        }
      }

      if (isValid) {
        lastInvalidMoves = [];
      } else {
        lastInvalidMoves = [...lastInvalidMoves, nextMoveResult.output.move];
      }

      await db.insert(schema.move).values({
        id: nanoid(),
        battle_d: payload.battleId,
        user_id: payload.userId,
        player_id: playerId,
        move: nextMoveResult.output.move,
        state: chess.fen(),
        is_valid: isValid,
        tokens_in: nextMoveResult.output.tokensIn,
        tokens_out: nextMoveResult.output.tokensOut,
      });

      if (chess.isGameOver()) {
        break;
      }
    }

    // Log game completion
    const totalMoves = chess.history().length;
    let outcome = "Unknown";

    if (chess.isCheckmate()) {
      outcome = `🏆 ${
        chess.turn() === "w" ? "Black" : "White"
      } wins by checkmate!`;
    } else if (chess.isStalemate()) {
      outcome = "🤝 Game ended in stalemate";
    } else if (chess.isDraw()) {
      outcome = "🤝 Game ended in draw";
    } else {
      outcome = "⏰ Game reached move limit (10 moves)";
    }

    logger.info(
      `${outcome} Final position: ${
        chess.fen().split(" ")[0]
      } (${totalMoves} moves played)`
    );

    return {
      battleId: payload.battleId,
      finalFen: chess.fen(),
      outcome,
      totalMoves,
    };
  },
});
