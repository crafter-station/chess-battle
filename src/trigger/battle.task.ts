import { logger, schemaTask } from "@trigger.dev/sdk";
import { Chess } from "chess.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import { GetNextMoveTask } from "./get-next-move.task";

// Configuration constants
const CONFIG = {
  MAX_INVALID_MOVES: 2, // Consecutive invalid moves before random fallback
  MAX_INVALID_MOVES_PER_PLAYER: 10, // Total invalid moves per player before forfeit
  MAX_GAME_MOVES: 100, // Prevent infinite games
} as const;

/**
 * Chess Battle Task - Orchestrates a complete chess game between two AI models
 *
 * This task manages the entire lifecycle of a chess battle:
 * 1. Validates the battle exists and hasn't started
 * 2. Runs the game loop with move generation, validation, and storage
 * 3. Handles invalid moves with retries and fallback strategies
 * 4. Determines the winner and updates the battle record
 *
 * @example
 * ```ts
 * const result = await BattleTask.triggerAndWait({
 *   battleId: "battle_123",
 *   userId: "user_456"
 * });
 * ```
 */
export const BattleTask = schemaTask({
  id: "battle",
  schema: z.object({
    /** Unique identifier for the battle to be played */
    battleId: z.string(),
    /** User ID who owns/initiated the battle */
    userId: z.string(),
  }),
  run: async (payload) => {
    // Fetch battle with all related data
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

    // Validate battle exists
    if (!battle) {
      throw new BattleNotFoundError(payload.battleId);
    }

    // Validate battle hasn't already started
    if (battle.moves.length > 0) {
      throw new BattleAlreadyStartedError(payload.battleId);
    }

    // Validate battle isn't already completed
    if (battle.outcome !== null) {
      throw new BattleAlreadyCompletedError(payload.battleId);
    }

    const chess = new Chess();
    let lastInvalidMoves: string[] = [];
    let moveCount = 0;

    // Track total invalid moves per player
    let whiteInvalidMoves = 0;
    let blackInvalidMoves = 0;

    logger.info(
      `🏁 Starting chess battle: ${battle.whitePlayer.model_id} (White) vs ${battle.blackPlayer.model_id} (Black) (Battle ID: ${payload.battleId})`,
    );

    let winner: string | null = null;
    let outcome: "win" | "draw" | null = null;
    let winnerColor: "white" | "black" | null = null;
    let gameEndReason = "";

    try {
      // Main game loop with timeout protection
      while (!chess.isGameOver() && moveCount < CONFIG.MAX_GAME_MOVES) {
        moveCount++;
        const moveNumber = Math.floor(chess.history().length / 2) + 1;
        const currentPlayer = chess.turn() === "w" ? "White" : "Black";
        const currentPlayerModelId =
          chess.turn() === "w"
            ? battle.whitePlayer.model_id
            : battle.blackPlayer.model_id;

        const playerId =
          chess.turn() === "w" ? battle.whitePlayer.id : battle.blackPlayer.id;

        logger.info(
          `Move ${moveNumber}: ${currentPlayer} (${currentPlayerModelId}) to play`,
        );

        // Generate next move with timeout handling
        const nextMoveResult = await GetNextMoveTask.triggerAndWait({
          board: chess.fen(),
          whitePlayerModelId: battle.whitePlayer.model_id,
          blackPlayerModelId: battle.blackPlayer.model_id,
          lastInvalidMoves,
        });

        if (!nextMoveResult.ok) {
          logger.error(`Failed to get next move: ${nextMoveResult.error}`);
          throw new BattleError(
            `Failed to get next move for ${currentPlayer}: ${nextMoveResult.error}`,
            "MOVE_GENERATION_FAILED",
          );
        }

        let isValid = true;
        const moveAttempt = nextMoveResult.output.move;

        // Validate and apply the move
        if (moveAttempt) {
          try {
            chess.move(moveAttempt);

            logger.info(
              `✅ ${currentPlayer} (${currentPlayerModelId}) Move ${moveNumber}: ${moveAttempt} - Position: ${chess.fen().split(" ")[0]}`,
            );

            // Clear invalid moves on successful move
            lastInvalidMoves = [];
          } catch (error) {
            isValid = false;
            if (
              error instanceof Error &&
              error.message.includes("Invalid move")
            ) {
              logger.warn(
                `❌ ${currentPlayer} (${currentPlayerModelId}) Move ${moveNumber}: Invalid move "${moveAttempt}" - ${error.message}`,
              );
              lastInvalidMoves.push(moveAttempt);
            } else {
              // Re-throw unexpected errors
              throw error;
            }
          }
        } else {
          logger.warn(
            `❌ ${currentPlayer} (${currentPlayerModelId}) Move ${moveNumber}: No move returned`,
          );
          lastInvalidMoves.push("");
          isValid = false;
        }

        // Store the move attempt in database
        await db.insert(schema.move).values({
          id: nanoid(),
          battle_id: payload.battleId,
          user_id: payload.userId,
          player_id: playerId,
          move: moveAttempt ?? null,
          state: chess.fen(),
          is_valid: isValid,
          tokens_in: nextMoveResult.output.tokensIn,
          tokens_out: nextMoveResult.output.tokensOut,
          response_time: nextMoveResult.output.responseTime,
          confidence: nextMoveResult.output.confidence,
          reasoning: nextMoveResult.output.reasoning,
        });

        // Update invalid move tracking
        if (!isValid) {
          // Track invalid moves per player
          if (chess.turn() === "w") {
            whiteInvalidMoves++;
          } else {
            blackInvalidMoves++;
          }

          // Check if player should forfeit due to too many invalid moves
          const currentInvalidCount =
            chess.turn() === "w" ? whiteInvalidMoves : blackInvalidMoves;
          if (currentInvalidCount >= CONFIG.MAX_INVALID_MOVES_PER_PLAYER) {
            const forfeitingPlayer = `${currentPlayer} (${currentPlayerModelId})`;
            logger.error(
              `🚫 ${forfeitingPlayer} forfeited with ${currentInvalidCount} invalid moves. Game ends.`,
            );
            throw new PlayerForfeitError(forfeitingPlayer, currentInvalidCount);
          }
        }

        // Handle too many invalid moves with fallback strategy
        if (lastInvalidMoves.length >= CONFIG.MAX_INVALID_MOVES) {
          logger.warn(
            `🤖 ${currentPlayer} (${currentPlayerModelId}) exceeded ${CONFIG.MAX_INVALID_MOVES} invalid moves: [${lastInvalidMoves.join(", ")}]. Making random move as fallback.`,
          );

          const availableMoves = chess.moves();
          if (availableMoves.length === 0) {
            logger.error("No legal moves available - game should be over");
            break;
          }

          const randomMove =
            availableMoves[Math.floor(Math.random() * availableMoves.length)];
          chess.move(randomMove);

          logger.info(
            `🎲 ${currentPlayer} (${currentPlayerModelId}) Random fallback: ${randomMove} - Position: ${chess.fen().split(" ")[0]}`,
          );

          // Store the random move
          await db.insert(schema.move).values({
            id: nanoid(),
            battle_id: payload.battleId,
            user_id: payload.userId,
            player_id: playerId,
            move: randomMove,
            state: chess.fen(),
            is_valid: true,
            tokens_in: null,
            tokens_out: null,
            response_time: null,
            confidence: null,
            reasoning: "Random fallback move due to repeated invalid moves",
          });

          lastInvalidMoves = [];
          isValid = true;
        }
      }

      // Check if we exited due to timeout
      if (moveCount >= CONFIG.MAX_GAME_MOVES) {
        logger.warn(
          `Game exceeded maximum moves (${CONFIG.MAX_GAME_MOVES}), forcing termination`,
        );
        throw new GameTimeoutError();
      }
    } catch (error) {
      if (error instanceof PlayerForfeitError) {
        // Handle player forfeit due to invalid moves
        const forfeitingPlayer = chess.turn() === "w" ? "White" : "Black";
        const winningPlayer = chess.turn() === "w" ? "Black" : "White";

        winner =
          chess.turn() === "w"
            ? battle.black_player_id
            : battle.white_player_id;
        winnerColor = chess.turn() === "w" ? "black" : "white";
        outcome = "win";
        gameEndReason = "forfeit_invalid_moves";

        logger.info(
          `🚫 ${forfeitingPlayer} forfeited due to excessive invalid moves. ${winningPlayer} wins by forfeit.`,
        );
      } else if (error instanceof GameTimeoutError) {
        // Handle timeout - could be treated as a draw or decide by other criteria
        outcome = "draw";
        gameEndReason = "timeout";
        logger.warn("Game ended due to timeout - treating as draw");
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
    // Analyze game completion (only if not already handled by error)
    const totalMoves = chess.history().length;

    // Determine outcome if game ended normally (not by forfeit/timeout)
    if (!outcome) {
      if (chess.isCheckmate()) {
        // The player who just moved wins (opposite of current turn)
        const winningPlayerId =
          chess.turn() === "w" ? battle.blackPlayer.id : battle.whitePlayer.id;
        winner = winningPlayerId;
        winnerColor =
          winningPlayerId === battle.white_player_id ? "white" : "black";
        outcome = "win";
        gameEndReason = "checkmate";

        logger.info(
          `🏆 Checkmate! ${winnerColor === "white" ? "White" : "Black"} (${
            winnerColor === "white"
              ? battle.whitePlayer.model_id
              : battle.blackPlayer.model_id
          }) wins by checkmate`,
        );
      } else {
        // Game ended in draw (stalemate, insufficient material, etc.)
        outcome = "draw";
        gameEndReason = chess.isStalemate()
          ? "stalemate"
          : chess.isInsufficientMaterial()
            ? "insufficient_material"
            : chess.isThreefoldRepetition()
              ? "threefold_repetition"
              : "other";

        // For draws, we could implement different tiebreaker strategies:
        // 1. No winner (true draw)
        // 2. Faster average response time wins
        // 3. Better move quality (confidence scores) wins

        // Currently using response time as tiebreaker (fastest wins)
        const moves = await db.query.move.findMany({
          where: and(eq(schema.move.battle_id, payload.battleId)),
        });

        const whiteMoves = moves.filter(
          (m) =>
            m.player_id === battle.whitePlayer.id && m.response_time !== null,
        );
        const blackMoves = moves.filter(
          (m) =>
            m.player_id === battle.blackPlayer.id && m.response_time !== null,
        );

        const avgResponseTimeWhite =
          whiteMoves.length > 0
            ? whiteMoves.reduce(
                (acc, move) => acc + (move.response_time ?? 0),
                0,
              ) / whiteMoves.length
            : Number.MAX_SAFE_INTEGER;

        const avgResponseTimeBlack =
          blackMoves.length > 0
            ? blackMoves.reduce(
                (acc, move) => acc + (move.response_time ?? 0),
                0,
              ) / blackMoves.length
            : Number.MAX_SAFE_INTEGER;

        // Faster average response time wins the tiebreaker
        if (avgResponseTimeWhite < avgResponseTimeBlack) {
          winner = battle.white_player_id;
          winnerColor = "white";
        } else if (avgResponseTimeBlack < avgResponseTimeWhite) {
          winner = battle.black_player_id;
          winnerColor = "black";
        } else {
          // True draw if response times are equal
          winner = null;
          winnerColor = null;
        }

        logger.info(
          `🤝 Draw by ${gameEndReason}. ${
            winner
              ? `Tiebreaker: ${winnerColor} (${
                  winnerColor === "white"
                    ? battle.whitePlayer.model_id
                    : battle.blackPlayer.model_id
                }) wins by faster average response time (${
                  winnerColor === "white"
                    ? avgResponseTimeWhite.toFixed(0)
                    : avgResponseTimeBlack.toFixed(0)
                }ms vs ${
                  winnerColor === "white"
                    ? avgResponseTimeBlack.toFixed(0)
                    : avgResponseTimeWhite.toFixed(0)
                }ms)`
              : "True draw - equal performance"
          }`,
        );
      }
    }

    // Update battle record with final result
    await db
      .update(schema.battle)
      .set({
        outcome,
        winner: winnerColor,
      })
      .where(eq(schema.battle.id, payload.battleId));

    logger.info(
      `🏁 Battle completed: ${outcome === "win" ? "Decisive result" : "Draw"} - ${
        winner
          ? `${winnerColor === "white" ? "White" : "Black"} (${
              winnerColor === "white"
                ? battle.whitePlayer.model_id
                : battle.blackPlayer.model_id
            }) ${outcome === "win" ? "won" : "won tiebreaker"}`
          : "True draw"
      } in ${totalMoves} moves`,
    );

    return {
      battleId: payload.battleId,
      finalFen: chess.fen(),
      outcome,
      totalMoves,
      winner,
      winnerColor,
      gameEndReason,
    };
  },
});

// Custom error types for better error handling
class BattleError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "BattleError";
  }
}

class BattleNotFoundError extends BattleError {
  constructor(battleId: string) {
    super(`Battle with ID ${battleId} not found`, "BATTLE_NOT_FOUND");
  }
}

class BattleAlreadyStartedError extends BattleError {
  constructor(battleId: string) {
    super(
      `Battle with ID ${battleId} has already started`,
      "BATTLE_ALREADY_STARTED",
    );
  }
}

class BattleAlreadyCompletedError extends BattleError {
  constructor(battleId: string) {
    super(
      `Battle with ID ${battleId} is already completed`,
      "BATTLE_ALREADY_COMPLETED",
    );
  }
}

class GameTimeoutError extends BattleError {
  constructor() {
    super("Game exceeded maximum number of moves", "GAME_TIMEOUT");
  }
}

class PlayerForfeitError extends BattleError {
  constructor(playerName: string, invalidMoveCount: number) {
    super(
      `${playerName} forfeited due to ${invalidMoveCount} invalid moves`,
      "PLAYER_FORFEIT",
    );
  }
}
