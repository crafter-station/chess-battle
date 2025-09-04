import { logger, schemaTask } from "@trigger.dev/sdk";
import { Chess } from "chess.js";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";

import { calculateKFactor, updateRatings } from "@/lib/elo";
import type { GameEndReason } from "@/lib/game-end-reason";
import { nanoid } from "@/lib/nanoid";

import { GetNextMoveTask } from "./get-next-move.task";
import { GetNextMoveStreamingTask } from "./get-next-move-streaming.task";

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
    /** Engine mode: json (generateObject) or streaming (free text + heuristic) */
    engineMode: z.enum(["json", "streaming"]).default("json"),
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
    let gameEndReason: GameEndReason | null = null;

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

        let isValid = true;
        let moveAttempt = null;
        let reasoning = null;
        let tokens_in = null;
        let tokens_out = null;
        let response_time = null;
        let confidence = null;
        let raw_response = null;

        const battleTimeout = await db.query.battle.findFirst({
          where: eq(schema.battle.id, payload.battleId),
          columns: {
            timeout_ms: true,
          },
        });

        if (!battleTimeout) {
          throw new BattleNotFoundError(payload.battleId);
        }

        // Generate next move with timeout handling
        const playerColorTag =
          chess.turn() === "w" ? "player:white" : "player:black";
        const baseTags = [
          `battle:${payload.battleId}`,
          playerColorTag,
          `model:${currentPlayerModelId}`,
          `mode:${payload.engineMode}`,
        ];

        const nextMoveResult =
          payload.engineMode === "streaming"
            ? await GetNextMoveStreamingTask.triggerAndWait(
                {
                  board: chess.fen(),
                  whitePlayerModelId: battle.whitePlayer.model_id,
                  blackPlayerModelId: battle.blackPlayer.model_id,
                  lastInvalidMoves,
                },
                {
                  maxDuration: battleTimeout.timeout_ms / 1000,
                  tags: [...baseTags, "task:get-next-move-streaming"],
                },
              )
            : await GetNextMoveTask.triggerAndWait(
                {
                  board: chess.fen(),
                  whitePlayerModelId: battle.whitePlayer.model_id,
                  blackPlayerModelId: battle.blackPlayer.model_id,
                  lastInvalidMoves,
                },
                {
                  maxDuration: battleTimeout.timeout_ms / 1000,
                  tags: [...baseTags, "task:get-next-move"],
                },
              );

        if (!nextMoveResult.ok) {
          logger.error(`Failed to get next move: ${nextMoveResult.error}`);
          if (
            nextMoveResult.error instanceof Error &&
            nextMoveResult.error.message.includes("maxDuration")
          ) {
            isValid = false;
            reasoning = "Move generation timed out";
            response_time = battleTimeout.timeout_ms;
          } else {
            throw new BattleError(
              `Failed to get next move for ${currentPlayer}: ${nextMoveResult.error}`,
              "MOVE_GENERATION_FAILED",
            );
          }
        } else {
          moveAttempt = nextMoveResult.output.move;
          reasoning = nextMoveResult.output.reasoning;
          tokens_in = nextMoveResult.output.tokensIn;
          tokens_out = nextMoveResult.output.tokensOut;
          response_time = nextMoveResult.output.responseTime;
          confidence = nextMoveResult.output.confidence;
          raw_response = nextMoveResult.output.rawResponse;
        }

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
          move: moveAttempt,
          state: chess.fen(),
          is_valid: isValid,
          tokens_in,
          tokens_out,
          response_time,
          confidence,
          reasoning,
          raw_response:
            payload.engineMode === "streaming"
              ? raw_response
              : isValid
                ? null
                : raw_response,
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
            response_time: battleTimeout.timeout_ms,
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
        // Handle timeout - determine winner based on time efficiency
        logger.warn(
          "Game ended due to timeout - determining winner by time efficiency",
        );

        const timeEfficiencyResult = await determineWinnerByTimeEfficiency(
          payload.battleId,
          battle,
          "timeout",
        );

        winner = timeEfficiencyResult.winner;
        winnerColor = timeEfficiencyResult.winnerColor;
        outcome = timeEfficiencyResult.outcome;
        gameEndReason = "timeout";
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
              : null;

        // For draws, use time efficiency as tiebreaker
        const timeEfficiencyResult = await determineWinnerByTimeEfficiency(
          payload.battleId,
          battle,
          gameEndReason ?? "draw",
        );

        winner = timeEfficiencyResult.winner;
        winnerColor = timeEfficiencyResult.winnerColor;
      }
    }

    // Update battle record with final result
    await db
      .update(schema.battle)
      .set({
        outcome,
        winner: winnerColor,
        game_end_reason: gameEndReason,
      })
      .where(eq(schema.battle.id, payload.battleId));

    const whiteCurrent = await db
      .select()
      .from(schema.player_rating)
      .where(eq(schema.player_rating.player_id, battle.white_player_id))
      .orderBy(desc(schema.player_rating.created_at))
      .limit(1);
    const blackCurrent = await db
      .select()
      .from(schema.player_rating)
      .where(eq(schema.player_rating.player_id, battle.black_player_id))
      .orderBy(desc(schema.player_rating.created_at))
      .limit(1);

    const whiteRating = whiteCurrent[0]?.rating ?? 1200;
    const whiteGames = whiteCurrent[0]?.games_played ?? 0;
    const whiteK = calculateKFactor(whiteGames, whiteRating);
    const blackRating = blackCurrent[0]?.rating ?? 1200;
    const blackGames = blackCurrent[0]?.games_played ?? 0;
    const blackK = calculateKFactor(blackGames, blackRating);

    const resultKey =
      outcome === "draw"
        ? "draw"
        : winnerColor === "white"
          ? "white_win"
          : "black_win";
    const calc = updateRatings(
      {
        rating: whiteRating,
        gamesPlayed: whiteGames,
        provisional: whiteGames < 10,
        kFactor: whiteK,
      },
      {
        rating: blackRating,
        gamesPlayed: blackGames,
        provisional: blackGames < 10,
        kFactor: blackK,
      },
      resultKey,
    );

    await db.insert(schema.player_rating).values({
      id: nanoid(),
      player_id: battle.white_player_id,
      tournament_id: battle.tournament_id ?? null,
      rating: calc.white.newRating,
      provisional: whiteGames + 1 < 10,
      games_played: whiteGames + 1,
      k_factor: whiteK,
    });
    await db.insert(schema.player_rating).values({
      id: nanoid(),
      player_id: battle.black_player_id,
      tournament_id: battle.tournament_id ?? null,
      rating: calc.black.newRating,
      provisional: blackGames + 1 < 10,
      games_played: blackGames + 1,
      k_factor: blackK,
    });

    logger.info(
      `🏁 Battle completed: ${outcome === "win" ? "Decisive result" : "Draw"} - ${
        winner
          ? `${winnerColor === "white" ? "White" : "Black"} (${
              winnerColor === "white"
                ? battle.whitePlayer.model_id
                : battle.blackPlayer.model_id
            }) ${
              gameEndReason === "timeout"
                ? "won by time efficiency"
                : outcome === "win"
                  ? "won"
                  : "won tiebreaker"
            }`
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

/**
 * Calculates time efficiency and determines winner based on average response times
 */
async function determineWinnerByTimeEfficiency(
  battleId: string,
  battle: {
    whitePlayer: { id: string; model_id: string };
    blackPlayer: { id: string; model_id: string };
    white_player_id: string;
    black_player_id: string;
  },
  context:
    | "timeout"
    | "stalemate"
    | "insufficient_material"
    | "threefold_repetition"
    | "draw",
) {
  // Get all moves to calculate time efficiency
  const moves = await db.query.move.findMany({
    where: and(eq(schema.move.battle_id, battleId)),
  });

  const whiteMoves = moves.filter(
    (m) => m.player_id === battle.whitePlayer.id && m.response_time !== null,
  );
  const blackMoves = moves.filter(
    (m) => m.player_id === battle.blackPlayer.id && m.response_time !== null,
  );

  const avgResponseTimeWhite =
    whiteMoves.length > 0
      ? whiteMoves.reduce((acc, move) => acc + (move.response_time ?? 0), 0) /
        whiteMoves.length
      : Number.MAX_SAFE_INTEGER;

  const avgResponseTimeBlack =
    blackMoves.length > 0
      ? blackMoves.reduce((acc, move) => acc + (move.response_time ?? 0), 0) /
        blackMoves.length
      : Number.MAX_SAFE_INTEGER;

  let winner: string | null = null;
  let winnerColor: "white" | "black" | null = null;
  let outcome: "win" | "draw" = "draw";

  // More efficient player (faster average response time) wins
  if (avgResponseTimeWhite < avgResponseTimeBlack) {
    winner = battle.white_player_id;
    winnerColor = "white";
    outcome = "win";
  } else if (avgResponseTimeBlack < avgResponseTimeWhite) {
    winner = battle.black_player_id;
    winnerColor = "black";
    outcome = "win";
  }
  // else: Equal efficiency - remains draw with null winner

  // Log the result
  const contextEmoji = context === "timeout" ? "🕐" : "🤝";
  const contextPrefix =
    context === "timeout" ? "Timeout:" : `Draw by ${context}.`;

  logger.info(
    outcome === "win"
      ? `${contextEmoji} ${contextPrefix} ${
          context === "timeout" ? "" : "Tiebreaker: "
        }${winnerColor} (${
          winnerColor === "white"
            ? battle.whitePlayer.model_id
            : battle.blackPlayer.model_id
        }) wins by ${context === "timeout" ? "time efficiency" : "faster average response time"} (${
          winnerColor === "white"
            ? avgResponseTimeWhite.toFixed(0)
            : avgResponseTimeBlack.toFixed(0)
        }ms vs ${
          winnerColor === "white"
            ? avgResponseTimeBlack.toFixed(0)
            : avgResponseTimeWhite.toFixed(0)
        }ms avg response time)`
      : `${contextEmoji} ${contextPrefix} Equal time efficiency - true draw`,
  );

  return {
    winner,
    winnerColor,
    outcome,
    avgResponseTimeWhite,
    avgResponseTimeBlack,
  };
}
