import { schemaTask } from "@trigger.dev/sdk";
import { generateObject, type ModelMessage } from "ai";
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

    const initialTime = Date.now();

    const generateMoveResult = await generateObject({
      model: playerModelId,
      schema: z.object({
        move: z.string().optional(),
        reasoning: z.string().max(280).optional(),
        confidence: z.number().int().min(0).max(100).optional(),
      }),
      messages: constructMessages(chess, payload.lastInvalidMoves),
      experimental_repairText: async () => {
        return "{}";
      },
      experimental_telemetry: {
        isEnabled: true,
      },
    });

    const move = generateMoveResult.object.move ?? null;
    const tokensIn = generateMoveResult.usage?.inputTokens ?? null;
    const tokensOut = generateMoveResult.usage?.outputTokens ?? null;
    const responseTime = Date.now() - initialTime;

    return {
      responseTime,
      move,
      tokensIn,
      tokensOut,
      reasoning: generateMoveResult.object.reasoning,
      confidence: generateMoveResult.object.confidence,
    };
  },
});

function constructMessages(chess: Chess, lastInvalidMoves: string[]) {
  const validMoves = chess.moves();

  return [
    {
      role: "system",
      content: `You are a chess grandmaster. Analyze the position and return a short JSON with the best legal move, an optional brief reasoning (max 2 sentences), and an optional confidence from 0-100.

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
- Return the move (e.g., "Nf3", "O-O", "Qxd4") in JSON format
- Format is {"move":"e4"}
- Strict JSON schema: {"move":"Nf3","reasoning":"...","confidence":82}
- Do not include any extra keys or text outside JSON
- Choose a move ONLY from the provided legal moves list
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
  lastInvalidMoves.length > 0
    ? `❌ Previous invalid moves: ${lastInvalidMoves
        .filter((move) => !!move)
        .join(", ")} - These were illegal. Choose a valid move.`
    : ""
}
Make your move:`,
    },
  ] satisfies ModelMessage[];
}
