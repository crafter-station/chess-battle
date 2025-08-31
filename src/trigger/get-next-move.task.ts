import { schemaTask } from "@trigger.dev/sdk";
import { generateObject, type ModelMessage } from "ai";
import { Chess } from "chess.js";
import { z } from "zod";

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
            "Brief explanation: MAX 100 words OR 2 sentences (whichever is shorter). Keep it concise.",
          ),
        confidence: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional()
          .describe(
            "Integer confidence score 0-100 (how certain you are about this move)",
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

    let rawResponse = null;

    if (
      generateMoveResult.response &&
      typeof generateMoveResult.response === "object" &&
      "body" in generateMoveResult.response &&
      generateMoveResult.response.body &&
      typeof generateMoveResult.response.body === "object" &&
      "content" in generateMoveResult.response.body &&
      Array.isArray(generateMoveResult.response.body.content) &&
      generateMoveResult.response.body.content[0] &&
      typeof generateMoveResult.response.body.content[0].text === "string"
    ) {
      rawResponse = generateMoveResult.response.body.content[0].text;
    } else {
      rawResponse = null;
    }

    return {
      responseTime,
      move,
      tokensIn,
      tokensOut,
      reasoning: generateMoveResult.object.reasoning,
      confidence: generateMoveResult.object.confidence,
      rawResponse,
    };
  },
});

function constructMessages(chess: Chess, lastInvalidMoves: string[]) {
  const validMoves = chess.moves();
  const gameHistory = chess.history();
  const moveNumber = Math.floor(gameHistory.length / 2) + 1;
  const currentPlayer = chess.turn() === "w" ? "White" : "Black";

  // Get additional game context
  const isCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();

  // Get last few moves for context
  const recentMoves = gameHistory.slice(-6).join(" ");

  return [
    {
      role: "system",
      content: `You are a chess engine analyzing positions with deep strategic understanding. Study the board visualization and game context carefully before selecting your move.

ANALYSIS PRIORITIES (in order):
1. TACTICAL: Checkmate threats, material captures, tactical motifs (pins, forks, skewers, discovered attacks)
2. SAFETY: King safety, escape squares, defensive resources
3. POSITIONAL: Piece activity, center control, pawn structure, space advantage
4. STRATEGIC: Development, coordination, long-term plans

EVALUATION FACTORS:
• Material count and piece values
• King safety and castling rights  
• Piece coordination and activity
• Pawn structure weaknesses/strengths
• Control of key squares (center, outposts)
• Open files and diagonals
• Tactical opportunities and threats

DECISION PROCESS:
1. Check for immediate tactical shots (checkmate, material gain)
2. Assess threats against your king and pieces
3. Look for forcing moves (checks, captures, threats)
4. Evaluate positional improvements
5. Consider opponent's likely responses

STRICT OUTPUT FORMAT:
{"move":"Nf3","reasoning":"Brief tactical/strategic explanation.","confidence":85}

CRITICAL REQUIREMENTS:
• MOVE: Must be from the provided legal moves list EXACTLY as written
• REASONING: Maximum 100 words OR 2 sentences - focus on key factors
• CONFIDENCE: Integer 0-100 based on position clarity and move strength
• Return ONLY the JSON object - no extra text or formatting

REASONING EXAMPLES:
✓ "Wins material with Rxe7+ fork, attacking king and bishop."
✓ "Develops with tempo, attacking f7 weakness while preparing O-O."
✗ "This is a good developing move that follows opening principles and improves piece coordination while maintaining a solid position for the middlegame phase."`,
    },
    {
      role: "user",
      content: `POSITION ANALYSIS - Move ${moveNumber} (${currentPlayer} to move)

BOARD VISUALIZATION:
${chess.ascii()}

GAME STATE:
• FEN: ${chess.fen()}
• ${isCheck ? "⚠️  IN CHECK" : ""}${isCheckmate ? "🏁 CHECKMATE" : ""}${isStalemate ? "🔄 STALEMATE" : ""}${isDraw ? "🤝 DRAW" : ""}
• Recent moves: ${recentMoves || "Game start"}
• Legal moves available: ${validMoves.length}

LEGAL MOVES: [${validMoves.join(", ")}]

${
  lastInvalidMoves.length > 0
    ? `❌ PREVIOUS INVALID ATTEMPTS: ${lastInvalidMoves
        .filter((move) => !!move)
        .join(", ")}
REMINDER: Choose ONLY from the legal moves list above!

`
    : ""
}Analyze the position and return your move:`,
    },
  ] satisfies ModelMessage[];
}
