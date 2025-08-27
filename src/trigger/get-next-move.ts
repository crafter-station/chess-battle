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
    lastInvalidMoves: z.array(z.string()),
  }),
  run: async (payload) => {
    const chess = new Chess(payload.board);

    const playerModelId =
      chess.turn() === "w"
        ? payload.whitePlayerModelId
        : payload.blackPlayerModelId;

    const validMoves = chess.moves();

    const generateMoveResult = await generateObject({
      model: playerModelId,
      output: "enum",
      enum: validMoves,
      messages: [
        {
          role: "system",
          content: `You are a chess grandmaster. Analyze the position comprehensively and respond with ONLY the best legal move in Standard Algebraic Notation (SAN).

KEY PRINCIPLES:
• Evaluate material, piece activity, pawn structure, and king safety
• Look for tactical opportunities: captures, checks, threats, and combinations
• Consider development, center control, and long-term strategy
• Anticipate opponent responses and maintain king safety

AVAILABLE LEGAL MOVES:
• Only choose from the provided legal moves list
• Each move is already validated as legal in the current position
• Consider the position's context and strategy when selecting

RESPONSE FORMAT:
- Return the move (e.g., "Nf3", "O-O", "Qxd4")
- Format is '{"result":"e4"}'
- Ensure the move is legal and follows chess rules
- Never leave your king in check unless checkmate is unavoidable`,
        },
        {
          role: "user",
          content: `Position: ${chess.fen()}
Move ${Math.floor(chess.history().length / 2) + 1} - ${
            chess.turn() === "w" ? "White" : "Black"
          } to move

LEGAL MOVES AVAILABLE: [${validMoves.join(", ")}]

${
  payload.lastInvalidMoves.length > 0
    ? `❌ Previous invalid moves: ${payload.lastInvalidMoves.join(
        ", "
      )} - These were illegal. Choose a valid move.`
    : ""
}
Make your move:`,
        },
      ],
      experimental_telemetry: {
        isEnabled: true,
      },
    });

    return {
      move: generateMoveResult.object,
      tokensIn: generateMoveResult.usage?.inputTokens,
      tokensOut: generateMoveResult.usage?.outputTokens,
    };
  },
});
