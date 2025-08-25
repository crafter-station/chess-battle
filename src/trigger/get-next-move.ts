import { schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";
import { Chess } from "chess.js";

export const GetNextMoveTask = schemaTask({
  id: "get-next-move",
  schema: z.object({
    board: z.string(), // FEN string
    whitePlayerModelId: z.string(),
    blackPlayerModelId: z.string(),
  }),
  run: async (payload) => {
    const chess = new Chess(payload.board);

    const playerModelId =
      chess.turn() === "w"
        ? payload.whitePlayerModelId
        : payload.blackPlayerModelId;

    const generateMoveResult = await generateObject({
      model: playerModelId,
      schema: z.object({
        move: z.string(),
      }),
      prompt: `
      You are a chess player.
      You are playing as ${chess.turn()}.
      You are given a board and you need to return the next move.
      The board is in FEN format.
      The move is in SAN format.

      The board is:
      ${chess.fen()}
      `,
      experimental_telemetry: {
        isEnabled: true,
      },
    });

    return {
      move: generateMoveResult.object.move,
      tokensIn: generateMoveResult.usage?.inputTokens,
      tokensOut: generateMoveResult.usage?.outputTokens,
    };
  },
});
