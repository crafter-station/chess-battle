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
    whitePlayerModelId: z.string(),
    blackPlayerModelId: z.string(),
  }),
  run: async (payload) => {
    const battleId = nanoid();

    await db.insert(schema.battle).values({
      id: battleId,
      whitePlayerModelId: payload.whitePlayerModelId,
      blackPlayerModelId: payload.blackPlayerModelId,
    });

    const whitePlayerId = nanoid();
    const blackPlayerId = nanoid();

    await db.insert(schema.player).values({
      id: whitePlayerId,
      modelId: payload.whitePlayerModelId,
    });

    await db.insert(schema.player).values({
      id: blackPlayerId,
      modelId: payload.blackPlayerModelId,
    });

    const chess = new Chess();

    for (let i = 0; i < 10; i++) {
      const playerModelId =
        chess.turn() === "w"
          ? payload.whitePlayerModelId
          : payload.blackPlayerModelId;

      const playerId = chess.turn() === "w" ? whitePlayerId : blackPlayerId;

      const nextMoveResult = await GetNextMoveTask.triggerAndWait({
        board: chess.fen(),
        whitePlayerModelId: payload.whitePlayerModelId,
        blackPlayerModelId: payload.blackPlayerModelId,
      });

      if (!nextMoveResult.ok) {
        throw new Error("Failed to get next move");
      }

      let isValid = true;

      try {
        chess.move(nextMoveResult.output.move);

        logger.info(`${playerModelId} made move ${nextMoveResult.output.move}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Invalid move")) {
          logger.error(
            `Player ${playerModelId} made an invalid move ${nextMoveResult.output.move}, retrying...`
          );
          isValid = false;
        }
      }

      await db.insert(schema.move).values({
        id: nanoid(),
        battleId,
        playerId,
        move: nextMoveResult.output.move,
        state: chess.fen(),
        isValid,
        tokensIn: nextMoveResult.output.tokensIn,
        tokensOut: nextMoveResult.output.tokensOut,
      });

      if (chess.isGameOver()) {
        break;
      }
    }

    return chess.fen();
  },
});
