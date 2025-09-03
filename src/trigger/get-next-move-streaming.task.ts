import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { type ModelMessage, streamText, type TextStreamPart } from "ai";
import { Chess } from "chess.js";
import { z } from "zod";

export type STREAMS = {
  // biome-ignore lint/complexity/noBannedTypes: Required for Trigger.dev streaming
  aiResponse: TextStreamPart<{}>;
};

export const GetNextMoveStreamingTask = schemaTask({
  id: "get-next-move-streaming",
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

    logger.info(`Starting streaming move generation for ${playerModelId}`);

    // Stream the AI response
    const result = streamText({
      model: playerModelId,
      messages: constructMessages(chess, payload.lastInvalidMoves),
      system:
        "You are a chess AI. Analyze the position and provide your best move with reasoning.",
    });

    // Stream and collect the response
    await metadata.stream("aiResponse", result.fullStream);

    // Collect the complete text from the stream
    let completeText = "";
    for await (const textPart of result.textStream) {
      completeText += textPart;
    }

    const responseTime = Date.now() - initialTime;

    // Extract move using heuristics
    const extractedMove = extractMoveFromResponse(completeText, chess.moves());

    // Extract reasoning and confidence using heuristics
    const extractedReasoning = extractReasoningFromResponse(completeText);
    const extractedConfidence = extractConfidenceFromResponse(completeText);

    // Get token usage if available
    const usage = await result.usage;
    const tokensIn = usage?.inputTokens ?? null;
    const tokensOut = usage?.outputTokens ?? null;

    logger.info(`Streaming completed. Extracted move: ${extractedMove}`);

    return {
      responseTime,
      move: extractedMove,
      tokensIn,
      tokensOut,
      reasoning: extractedReasoning,
      confidence: extractedConfidence,
      rawResponse: completeText,
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
      content: `CHESS ANALYSIS ENGINE

You are a master-level chess engine. Analyze the position and provide your best move.

ANALYSIS PRIORITIES:
1. CHECKMATE/THREATS: Immediate mate, material wins, forced sequences
2. KING SAFETY: Escape squares, defensive resources, attack prevention  
3. TACTICS: Pins, forks, skewers, discovered attacks, sacrifices
4. POSITION: Piece activity, center control, pawn structure, space
5. STRATEGY: Development, coordination, long-term planning

EVALUATION CHECKLIST:
- Material balance and piece values
- King safety and castling status
- Piece coordination and mobility
- Pawn structure strengths/weaknesses
- Control of key squares (center, outposts)
- Open files, diagonals, and weak squares
- Immediate tactical opportunities

MOVE SELECTION PROCESS:
1. Scan for forced wins (checkmate in 1-3 moves)
2. Check for material-winning tactics
3. Assess and counter immediate threats
4. Look for forcing moves (checks, captures, threats)
5. Evaluate positional improvements
6. Consider opponent's best responses

CONFIDENCE SCORING:
• 90-100: Forced mate, clear material win, obvious best move
• 80-89: Strong tactical advantage, clearly superior position
• 70-79: Good positional move, slight advantage
• 60-69: Reasonable choice among several options
• 50-59: Uncertain position, multiple viable moves
• 1-49: Defensive/desperate moves, difficult position

FORMAT YOUR RESPONSE:
Include your move clearly in your analysis. You can discuss the position freely, but make sure to clearly state:
- MOVE: [your chosen move]
- REASONING: [brief explanation]
- CONFIDENCE: [1-100 score]`,
    },
    {
      role: "user",
      content: `POSITION ANALYSIS - Move ${moveNumber} (${currentPlayer} to move)

BOARD VISUALIZATION:
${chess.ascii()}

GAME STATE:
• FEN: ${chess.fen()}
• Status: ${isCheck ? "IN CHECK" : ""}${isCheckmate ? "CHECKMATE" : ""}${isStalemate ? "STALEMATE" : ""}${isDraw ? "DRAW" : ""}
• Recent moves: ${recentMoves || "Game start"}
• Legal moves available: ${validMoves.length}

LEGAL MOVES (choose from this list):
[${validMoves.join(", ")}]

${
  lastInvalidMoves.length > 0
    ? `PREVIOUS INVALID ATTEMPTS: ${lastInvalidMoves
        .filter((move) => !!move)
        .join(", ")}

CRITICAL: These moves were rejected! Choose ONLY from the legal moves list above!

`
    : ""
}Analyze the position and provide your best move with reasoning and confidence score:`,
    },
  ] satisfies ModelMessage[];
}

/**
 * Extract chess move from AI response using multiple heuristic patterns
 */
function extractMoveFromResponse(
  response: string,
  legalMoves: string[],
): string | null {
  const text = response.toLowerCase();

  // Pattern 1: "MOVE: e4" or "Move: e4"
  const moveColonPattern =
    /(?:^|\s)move\s*:\s*([a-h][1-8](?:[a-h][1-8])?|[NBRQK][a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)/im;
  let match = text.match(moveColonPattern);
  if (match) {
    const extractedMove = match[1];
    const validMove = findMatchingLegalMove(extractedMove, legalMoves);
    if (validMove) return validMove;
  }

  // Pattern 2: "I recommend e4" or "I choose Nf3"
  const recommendPattern =
    /(?:recommend|choose|suggest|play)\s+([a-h][1-8](?:[a-h][1-8])?|[NBRQK][a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)/im;
  match = text.match(recommendPattern);
  if (match) {
    const extractedMove = match[1];
    const validMove = findMatchingLegalMove(extractedMove, legalMoves);
    if (validMove) return validMove;
  }

  // Pattern 3: "The best move is e4"
  const bestMovePattern =
    /(?:best|good|strong)\s+move\s+(?:is|would be)\s+([a-h][1-8](?:[a-h][1-8])?|[NBRQK][a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)/im;
  match = text.match(bestMovePattern);
  if (match) {
    const extractedMove = match[1];
    const validMove = findMatchingLegalMove(extractedMove, legalMoves);
    if (validMove) return validMove;
  }

  // Pattern 4: Direct mention of legal moves in quotes
  const quotedMovePattern =
    /["']([a-h][1-8](?:[a-h][1-8])?|[NBRQK][a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)["']/g;
  let quotedMatch: RegExpExecArray | null = quotedMovePattern.exec(text);
  while (quotedMatch !== null) {
    const extractedMove = quotedMatch[1];
    const validMove = findMatchingLegalMove(extractedMove, legalMoves);
    if (validMove) return validMove;
    quotedMatch = quotedMovePattern.exec(text);
  }

  // Pattern 5: Find any legal move mentioned in the text
  for (const legalMove of legalMoves) {
    const escapedMove = legalMove.replace(/[+#]/g, "\\$&"); // Escape special chars
    const moveRegex = new RegExp(`\\b${escapedMove}\\b`, "i");
    if (moveRegex.test(text)) {
      return legalMove;
    }
  }

  // Pattern 6: Extract any chess notation from the response
  const chessNotationPattern =
    /\b([a-h][1-8](?:[a-h][1-8])?|[NBRQK][a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)\b/g;
  let notationMatch: RegExpExecArray | null =
    chessNotationPattern.exec(response);
  while (notationMatch !== null) {
    const extractedMove = notationMatch[1];
    const validMove = findMatchingLegalMove(extractedMove, legalMoves);
    if (validMove) return validMove;
    notationMatch = chessNotationPattern.exec(response);
  }

  logger.warn(
    `Failed to extract valid move from response: ${response.substring(0, 200)}...`,
  );
  return null;
}

/**
 * Find matching legal move considering various notations
 */
function findMatchingLegalMove(
  extractedMove: string,
  legalMoves: string[],
): string | null {
  // Direct match
  if (legalMoves.includes(extractedMove)) {
    return extractedMove;
  }

  // Case insensitive match
  const lowerExtracted = extractedMove.toLowerCase();
  for (const legalMove of legalMoves) {
    if (legalMove.toLowerCase() === lowerExtracted) {
      return legalMove;
    }
  }

  // Match without check/checkmate symbols
  const cleanExtracted = extractedMove.replace(/[+#]/g, "");
  for (const legalMove of legalMoves) {
    const cleanLegal = legalMove.replace(/[+#]/g, "");
    if (cleanLegal === cleanExtracted) {
      return legalMove;
    }
  }

  // Match castling variations (O-O vs 0-0)
  if (extractedMove.match(/^[O0]-[O0](-[O0])?$/)) {
    const standardCastling = extractedMove.replace(/0/g, "O");
    for (const legalMove of legalMoves) {
      if (legalMove === standardCastling) {
        return legalMove;
      }
    }
  }

  return null;
}

/**
 * Extract reasoning from AI response using heuristic patterns
 */
function extractReasoningFromResponse(response: string): string | null {
  const text = response;

  // Pattern 1: "REASONING: ..." or "Reasoning: ..."
  const reasoningColonPattern = /reasoning\s*:\s*([^.!?]*[.!?])/im;
  let match = text.match(reasoningColonPattern);
  if (match) {
    return cleanReasoning(match[1]);
  }

  // Pattern 2: "because" or "since" explanations
  const becausePattern = /(?:because|since)\s+([^.!?]*[.!?])/im;
  match = text.match(becausePattern);
  if (match) {
    return cleanReasoning(match[1]);
  }

  // Pattern 3: First sentence that mentions chess concepts
  const chessConceptsPattern =
    /((?:controls?|develops?|attacks?|defends?|threatens?|captures?|pins?|forks?|skewers?|mates?|checks?)[^.!?]*[.!?])/im;
  match = text.match(chessConceptsPattern);
  if (match) {
    return cleanReasoning(match[1]);
  }

  // Pattern 4: Look for explanation after move mention
  const afterMovePattern =
    /(?:[a-h][1-8]|[NBRQK][a-h]?[1-8]?x?[a-h][1-8]|O-O(?:-O)?)\s+([^.!?]*[.!?])/i;
  match = text.match(afterMovePattern);
  if (match) {
    return cleanReasoning(match[1]);
  }

  // Fallback: Take first meaningful sentence
  const sentences = text.match(/[^.!?]*[.!?]/g);
  if (sentences && sentences.length > 0) {
    for (const sentence of sentences) {
      const cleaned = cleanReasoning(sentence);
      if (cleaned && cleaned.length > 10 && cleaned.length <= 200) {
        return cleaned;
      }
    }
  }

  return null;
}

/**
 * Extract confidence score from AI response
 */
function extractConfidenceFromResponse(response: string): number | null {
  const text = response;

  // Pattern 1: "CONFIDENCE: 85" or "Confidence: 85"
  const confidenceColonPattern = /confidence\s*:\s*(\d{1,3})/im;
  let match = text.match(confidenceColonPattern);
  if (match) {
    const confidence = parseInt(match[1], 10);
    return isValidConfidence(confidence) ? confidence : null;
  }

  // Pattern 2: "confidence of 85" or "confidence level 85"
  const confidenceOfPattern = /confidence\s+(?:of|level|score)\s+(\d{1,3})/im;
  match = text.match(confidenceOfPattern);
  if (match) {
    const confidence = parseInt(match[1], 10);
    return isValidConfidence(confidence) ? confidence : null;
  }

  // Pattern 3: Percentage confidence "85% confident"
  const percentagePattern = /(\d{1,3})%\s*confident/im;
  match = text.match(percentagePattern);
  if (match) {
    const confidence = parseInt(match[1], 10);
    return isValidConfidence(confidence) ? confidence : null;
  }

  // Pattern 4: "I'm 85% sure" or "85% certain"
  const certaintyPattern = /(?:i'm\s+)?(\d{1,3})%\s*(?:sure|certain)/im;
  match = text.match(certaintyPattern);
  if (match) {
    const confidence = parseInt(match[1], 10);
    return isValidConfidence(confidence) ? confidence : null;
  }

  // Fallback: Look for any number between 1-100
  const numberPattern = /\b([1-9]\d?|100)\b/g;
  let numberMatch: RegExpExecArray | null = numberPattern.exec(text);
  while (numberMatch !== null) {
    const confidence = parseInt(numberMatch[1], 10);
    if (isValidConfidence(confidence)) {
      return confidence;
    }
    numberMatch = numberPattern.exec(text);
  }

  return null;
}

/**
 * Clean and validate reasoning text
 */
function cleanReasoning(reasoning: string): string | null {
  if (!reasoning) return null;

  // Clean up the reasoning
  let cleaned = reasoning.trim();

  // Remove common prefixes
  cleaned = cleaned.replace(/^(?:because|since)\s+/i, "");
  cleaned = cleaned.replace(/^reasoning\s*:\s*/i, "");

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Validate length
  if (cleaned.length < 5 || cleaned.length > 200) {
    return null;
  }

  return cleaned;
}

/**
 * Validate confidence score is within acceptable range
 */
function isValidConfidence(confidence: number): boolean {
  return Number.isInteger(confidence) && confidence >= 1 && confidence <= 100;
}
