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
        move: z
          .string()
          .optional()
          .describe("The best legal move from the provided list"),
        reasoning: z
          .string()
          .optional()
          .describe(
            "Brief explanation: MAX 100 words OR 2 sentences (whichever is shorter). Keep it concise."
          ),
        confidence: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional()
          .describe(
            "Integer confidence score 0-100 (how certain you are about this move)"
          ),
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
      content: `You are a chess engine. Analyze the position and return ONLY a JSON object with your move selection.

CHESS ANALYSIS:
• Prioritize: material advantage, piece activity, king safety, tactical shots
• Look for: captures, checks, threats, forks, pins, skewers
• Consider: development, center control, pawn structure

STRICT OUTPUT FORMAT:
{"move":"Nf3","reasoning":"Brief explanation here.","confidence":85}

CRITICAL REQUIREMENTS:
• MOVE: Must be from the provided legal moves list ONLY
• REASONING: Maximum 100 words OR 2 sentences - whichever is shorter
• CONFIDENCE: Integer 0-100 (your certainty in this move)
• NO extra text, explanations, or keys outside this JSON
• NO markdown, code blocks, or additional formatting
• Return ONLY the JSON object

REASONING EXAMPLES:
✓ "Develops knight and controls center. Prepares castling."
✓ "Captures free material with tempo."
✗ "This move develops the knight to f3 which is a classical opening principle that helps control the center squares e4 and d4 while also preparing for kingside castling which will improve king safety in the middlegame."`,
    },
    {
      role: "user",
      content: `FEN: ${chess.fen()}
Move ${Math.floor(chess.history().length / 2) + 1} - ${
        chess.turn() === "w" ? "White" : "Black"
      } to move

LEGAL MOVES: [${validMoves.join(", ")}]

${
  lastInvalidMoves.length > 0
    ? `❌ INVALID ATTEMPTS: ${lastInvalidMoves
        .filter((move) => !!move)
        .join(", ")} - Choose from legal moves only!`
    : ""
}

Return JSON now:`,
    },
  ] satisfies ModelMessage[];
}
