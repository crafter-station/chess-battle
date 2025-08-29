import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { Chess } from "chess.js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

import { GetNextMoveTask } from "./get-next-move.task";
import { and, eq } from "drizzle-orm";

export const BattleTask = schemaTask({
  id: "battle",
  schema: z.object({
    battleId: z.string(),
    userId: z.string(),
  }),
  run: async (payload) => {
    const battle = await db.query.battle.findFirst({
      where: and(
        eq(schema.battle.id, payload.battleId),
        eq(schema.battle.user_id, payload.userId)
      ),
      with: {
        whitePlayer: true,
        blackPlayer: true,
        moves: true,
      },
    });

    if (!battle) {
      throw new Error("Battle not found");
    }

    if (battle.moves.length > 0) {
      throw new Error("Battle already started");
    }

    const chess = new Chess();

    logger.info(
      `🏁 Starting chess battle: ${battle.whitePlayer.model_id} vs ${battle.blackPlayer.model_id} (Battle ID: ${payload.battleId})`
    );

    let lastInvalidMoves: string[] = [];

    while (true) {
      const moveNumber = Math.floor(chess.history().length / 2) + 1;
      const currentPlayer = chess.turn() === "w" ? "White" : "Black";

      const playerId =
        chess.turn() === "w" ? battle.whitePlayer.id : battle.blackPlayer.id;

      const nextMoveResult = await GetNextMoveTask.triggerAndWait({
        board: chess.fen(),
        whitePlayerModelId: battle.whitePlayer.model_id,
        blackPlayerModelId: battle.blackPlayer.model_id,
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
        battle_id: payload.battleId,
        user_id: payload.userId,
        player_id: playerId,
        move: nextMoveResult.output.move,
        state: chess.fen(),
        is_valid: isValid,
        tokens_in: nextMoveResult.output.tokensIn,
        tokens_out: nextMoveResult.output.tokensOut,
        response_time: nextMoveResult.output.responseTime,
      });

      if (chess.isGameOver()) {
        break;
      }
    }

    // Log game completion
    const totalMoves = chess.history().length;

    let winner: string | null = null;
    let outcome: "win" | "draw" | null = null;
    if (chess.isCheckmate()) {
      winner =
        chess.turn() === "w" ? battle.blackPlayer.id : battle.whitePlayer.id;
      outcome = "win";
    } else {
      // If the game is a draw, we need to determine the winner based on the response time.
      outcome = "draw";
      const moves = await db.query.move.findMany({
        where: and(eq(schema.move.battle_id, payload.battleId)),
      });

      const responseTimeWhite = moves
        .filter((m) => m.player_id === battle.whitePlayer.id)
        .reduce((acc, move) => acc + move.response_time, 0);

      const responseTimeBlack = moves
        .filter((m) => m.player_id === battle.blackPlayer.id)
        .reduce((acc, move) => acc + move.response_time, 0);

      winner =
        responseTimeWhite < responseTimeBlack
          ? battle.white_player_id
          : battle.black_player_id;
    }

    await db
      .update(schema.battle)
      .set({
        outcome,
        winner: winner === battle.white_player_id ? "white" : "black",
      })
      .where(eq(schema.battle.id, payload.battleId));

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
      winner,
    };
  },
});
