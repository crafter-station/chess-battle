import { logger, schemaTask } from "@trigger.dev/sdk";
import { Chess } from "chess.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import { GetNextMoveTask } from "./get-next-move.task";

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
        eq(schema.battle.user_id, payload.userId),
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
      `🏁 Starting chess battle: ${battle.whitePlayer.model_id} (White) vs ${battle.blackPlayer.model_id} (Black) (Battle ID: ${payload.battleId})`,
    );

    let lastInvalidMoves: string[] = [];

    while (true) {
      const moveNumber = Math.floor(chess.history().length / 2) + 1;
      const currentPlayer = chess.turn() === "w" ? "White" : "Black";
      const currentPlayerModelId =
        chess.turn() === "w"
          ? battle.whitePlayer.model_id
          : battle.blackPlayer.model_id;

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

      if (nextMoveResult.output.move) {
        try {
          chess.move(nextMoveResult.output.move);

          logger.info(
            `${currentPlayer} (${currentPlayerModelId}) (Move ${moveNumber}): ${
              nextMoveResult.output.move
            } - Position: ${chess.fen().split(" ")[0]}`,
          );
        } catch (error) {
          isValid = false;
          if (
            error instanceof Error &&
            error.message.includes("Invalid move")
          ) {
            logger.error(
              `${currentPlayer} (${currentPlayerModelId}) (Move ${moveNumber}): ❌ Invalid move "${nextMoveResult.output.move}" - ${error.message}. Retrying...`,
            );
          } else {
            throw error;
          }
        }
      } else {
        logger.error(
          `${currentPlayer} (${currentPlayerModelId}) (Move ${moveNumber}): ❌ No move returned.`,
        );
        isValid = false;
      }

      await db.insert(schema.move).values({
        id: nanoid(),
        battle_id: payload.battleId,
        user_id: payload.userId,
        player_id: playerId,
        move: nextMoveResult.output.move ?? null,
        state: chess.fen(),
        is_valid: isValid,
        tokens_in: nextMoveResult.output.tokensIn,
        tokens_out: nextMoveResult.output.tokensOut,
        response_time: nextMoveResult.output.responseTime,
        confidence: nextMoveResult.output.confidence,
        reasoning: nextMoveResult.output.reasoning,
      });

      if (lastInvalidMoves.length > 2) {
        logger.warn(
          `🤖 ${currentPlayer} (${currentPlayerModelId}) Too many invalid moves: ${lastInvalidMoves.join(
            ", ",
          )}. Let's make a move ourselves.`,
        );
        const randomMove =
          chess.moves()[Math.floor(Math.random() * chess.moves().length)];
        chess.move(randomMove);
        logger.info(
          `🤖 ${currentPlayer} (${currentPlayerModelId}) Random move: ${randomMove} - Position: ${
            chess.fen().split(" ")[0]
          }`,
        );
        isValid = true;
        lastInvalidMoves = [];

        await db.insert(schema.move).values({
          id: nanoid(),
          battle_id: payload.battleId,
          user_id: payload.userId,
          player_id: playerId,
          move: randomMove,
          state: chess.fen(),
          is_valid: true,
        });
      }

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
        .reduce((acc, move) => acc + (move.response_time ?? 0), 0);

      const responseTimeBlack = moves
        .filter((m) => m.player_id === battle.blackPlayer.id)
        .reduce((acc, move) => acc + (move.response_time ?? 0), 0);

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
      `🏆 ${outcome} - ${
        winner === battle.white_player_id
          ? `White (${battle.whitePlayer.model_id})`
          : `Black (${battle.blackPlayer.model_id})`
      } won`,
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
