import { logger, schemaTask } from "@trigger.dev/sdk";
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
          .describe(
            "REQUIRED: The exact move from the legal moves list (e.g., 'Nf3', 'e4', 'O-O')",
          ),
        reasoning: z
          .string()
          .optional()
          .describe(
            "REQUIRED: Brief tactical/strategic explanation (MAX 100 words OR 2 sentences)",
          ),
        confidence: z
          .number()
          .optional()
          .describe(
            "REQUIRED: Integer confidence score 1-100 (how certain you are about this move)",
          ),
      }),
      messages: constructMessages(chess, payload.lastInvalidMoves),
      experimental_repairText: async () => {
        return JSON.stringify({
          move: "",
        });
      },
      experimental_telemetry: {
        isEnabled: true,
      },
    });

    const responseTime = Date.now() - initialTime;

    const move = generateMoveResult.object.move ?? null;
    const tokensIn = generateMoveResult.usage?.inputTokens ?? null;
    const tokensOut = generateMoveResult.usage?.outputTokens ?? null;

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

    logger.info(`Raw response: ${rawResponse}`);

    return {
      responseTime,
      move: move ? move : null,
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
      content: `🏁 CHESS ANALYSIS ENGINE - STRICT JSON OUTPUT REQUIRED 🏁

You are a master-level chess engine. Analyze the position and return your response in EXACT JSON format.

⚠️ CRITICAL: You MUST return ONLY a valid JSON object. NO other text before or after.

📋 REQUIRED JSON STRUCTURE:
{
  "move": "EXACT_MOVE_FROM_LIST",
  "reasoning": "Brief explanation (max 100 words)",
  "confidence": INTEGER_1_TO_100
}

🎯 ANALYSIS PRIORITIES:
1. CHECKMATE/THREATS: Immediate mate, material wins, forced sequences
2. KING SAFETY: Escape squares, defensive resources, attack prevention  
3. TACTICS: Pins, forks, skewers, discovered attacks, sacrifices
4. POSITION: Piece activity, center control, pawn structure, space
5. STRATEGY: Development, coordination, long-term planning

📊 EVALUATION CHECKLIST:
✓ Material balance and piece values
✓ King safety and castling status
✓ Piece coordination and mobility
✓ Pawn structure strengths/weaknesses
✓ Control of key squares (center, outposts)
✓ Open files, diagonals, and weak squares
✓ Immediate tactical opportunities

🔍 MOVE SELECTION PROCESS:
1. Scan for forced wins (checkmate in 1-3 moves)
2. Check for material-winning tactics
3. Assess and counter immediate threats
4. Look for forcing moves (checks, captures, threats)
5. Evaluate positional improvements
6. Consider opponent's best responses

💡 REASONING EXAMPLES (GOOD):
✓ "Rxe7+ wins the bishop with check, gaining material advantage."
✓ "Develops knight attacking f7 weakness while preparing castling."
✓ "Controls the center and prevents opponent's knight development."
✓ "Forces mate in 3: after Qh6 threatens Qxh7#, defense impossible."

❌ REASONING EXAMPLES (TOO LONG):
✗ "This developing move follows classical opening principles by improving piece coordination and maintaining a solid defensive structure while preparing for the middlegame transition with strategic planning considerations."

🎯 CONFIDENCE SCORING:
• 90-100: Forced mate, clear material win, obvious best move
• 80-89: Strong tactical advantage, clearly superior position
• 70-79: Good positional move, slight advantage
• 60-69: Reasonable choice among several options
• 50-59: Uncertain position, multiple viable moves
• 1-49: Defensive/desperate moves, difficult position

⚠️ ABSOLUTE REQUIREMENTS:
1. MOVE must be EXACTLY from the legal moves list (case-sensitive)
2. REASONING must be under 100 words (brief and focused)
3. CONFIDENCE must be integer 1-100 (no decimals)
4. Return ONLY the JSON object (no extra text, quotes, or formatting)
5. JSON must be valid and parseable

🚨 FORBIDDEN RESPONSES:
- Any text before the JSON object
- Any text after the JSON object  
- Incomplete JSON objects
- Invalid JSON syntax
- Moves not in the legal moves list
- Confidence scores of 0 or over 100

EXAMPLE VALID RESPONSES:
{"move":"e4","reasoning":"Controls center, opens diagonals for development.","confidence":75}
{"move":"Qxh7#","reasoning":"Checkmate! Queen captures pawn with mate.","confidence":100}
{"move":"Nf3","reasoning":"Develops piece toward center, prepares castling.","confidence":70}`,
    },
    {
      role: "user",
      content: `🎯 POSITION ANALYSIS - Move ${moveNumber} (${currentPlayer} to move)

📋 BOARD VISUALIZATION:
${chess.ascii()}

📊 GAME STATE:
• FEN: ${chess.fen()}
• Status: ${isCheck ? "⚠️  IN CHECK" : ""}${isCheckmate ? "🏁 CHECKMATE" : ""}${isStalemate ? "🔄 STALEMATE" : ""}${isDraw ? "🤝 DRAW" : ""}
• Recent moves: ${recentMoves || "Game start"}
• Legal moves available: ${validMoves.length}

🎲 LEGAL MOVES (choose EXACTLY from this list):
[${validMoves.join(", ")}]

${
  lastInvalidMoves.length > 0
    ? `❌ PREVIOUS INVALID ATTEMPTS: ${lastInvalidMoves
        .filter((move) => !!move)
        .join(", ")}

🚨 CRITICAL: These moves were rejected! Choose ONLY from the legal moves list above!

`
    : ""
}🎯 REQUIRED OUTPUT FORMAT:
{"move":"YOUR_MOVE","reasoning":"Your brief explanation","confidence":YOUR_SCORE}

⚠️ REMINDERS:
• Move MUST be from legal moves list EXACTLY as written
• Return ONLY the JSON object (no other text)
• Reasoning max 100 words
• Confidence 1-100 (integer only)

Analyze the position and provide your JSON response:`,
    },
  ] satisfies ModelMessage[];
}
