import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { streamText } from "ai";
import { Chess } from "chess.js";
import { z } from "zod";

// Heuristic regexes to extract a SAN move from arbitrary text
const SAN_REGEXES: RegExp[] = [
  // Explicit final answer pattern
  /Final\s*Answer\s*:\s*([A-Za-z0-9=+#-]+)\b/i,
  // Castling (O-O, O-O-O) with optional check/mate
  /\bO-O(?:-O)?[#+]?\b/g,
  // Piece moves with optional disambiguation and capture, e.g., Nf3, R1e3, Qxe7+, Bbd2, Kd1
  /\b(?:[NBRQK])[a-h1-8]?x?[a-h][1-8][+#]?\b/g,
  // Pawn moves and captures with optional promotion and check/mate, e.g., e4, exd5, a8=Q, bxa1=Q+, cxd8=Q#
  /\b(?:[a-h]x)?[a-h][1-8](?:=[NBRQ])?[+#]?\b/g,
];

function normalizeSanForComparison(san: string): string {
  return san.replace(/[+#]$/g, "");
}

function extractMoveFromText(
  text: string,
  legalMoves: string[],
): string | null {
  const legalSet = new Set(legalMoves);
  const normalizedLegalSet = new Set(legalMoves.map(normalizeSanForComparison));

  // 1) If there is a "Final Answer: <move>" style, try that first.
  const finalAns = text.match(/Final\s*Answer\s*:\s*([A-Za-z0-9=+#-]+)/i);
  if (finalAns?.[1]) {
    const candidate = finalAns[1].trim();
    if (legalSet.has(candidate)) return candidate;
    const normalized = normalizeSanForComparison(candidate);
    if (normalizedLegalSet.has(normalized)) {
      // Find the exact legal move with the same normalized form
      const exact = legalMoves.find(
        (m) => normalizeSanForComparison(m) === normalized,
      );
      if (exact) return exact;
    }
  }

  // 2) Fallback: scan the entire text for SAN-like tokens in order
  const seen = new Set<string>();
  for (const regex of SAN_REGEXES) {
    // Reset lastIndex if global
    if (regex.global) regex.lastIndex = 0;

    let match: RegExpExecArray | null = regex.exec(text);
    // Use exec loop to preserve order of occurrence
    while (match !== null) {
      const raw = (match[1] ?? match[0]).trim();
      if (!raw) {
        match = regex.exec(text);
        continue;
      }
      if (seen.has(raw)) {
        match = regex.exec(text);
        continue;
      }
      seen.add(raw);

      if (legalSet.has(raw)) return raw;
      const normalized = normalizeSanForComparison(raw);
      if (normalizedLegalSet.has(normalized)) {
        const exact = legalMoves.find(
          (m) => normalizeSanForComparison(m) === normalized,
        );
        if (exact) return exact;
      }

      match = regex.exec(text);
    }
  }

  return null;
}

function constructMessages(chess: Chess, lastInvalidMoves: string[]) {
  const legalMoves = chess.moves();
  const boardAscii = chess.ascii();
  const currentTurn = chess.turn() === "w" ? "White" : "Black";
  const history = chess.history();
  const recentMoves = history.slice(-6).join(" ");

  const system = `You are a chess assistant playing as ${currentTurn}.

You must choose exactly one legal move from the provided list. Think briefly and then provide a single final answer on the last line in the format: Final Answer: <SAN>.

Rules:
- Only respond with plain text (no JSON)
- Use Standard Algebraic Notation (SAN), e.g., Nf3, exd5, O-O, O-O-O, Qxh7#
- The final answer must be exactly one move from the legal moves list
- Avoid repeating previously invalid moves if any are provided
`;

  const user = `Position:
${boardAscii}

FEN: ${chess.fen()}
Recent moves: ${recentMoves || "Game start"}
Legal moves (${legalMoves.length}): ${legalMoves.join(", ")}
${lastInvalidMoves.length > 0 ? `Previously invalid: ${lastInvalidMoves.filter(Boolean).join(", ")}` : ""}

Provide your reasoning in a few short sentences if helpful. End your response with a single line:
Final Answer: <SAN>`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

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

    const start = Date.now();

    // Stream the model's response
    const result = streamText({
      model: playerModelId,
      messages: constructMessages(chess, payload.lastInvalidMoves),
      // Keep system/user messages simple and provider-agnostic
      // No provider-specific options here to support multiple vendors
    });

    // Expose the text stream for realtime subscriptions
    const stream = await metadata.stream("llm", result.textStream);

    // Accumulate text as it streams
    let fullText = "";
    for await (const delta of stream) {
      fullText += typeof delta === "string" ? delta : "";
    }

    const responseTime = Date.now() - start;

    // Extract a SAN move using regex heuristics, constrained to legal moves
    const legalMoves = chess.moves();
    const extractedMove = extractMoveFromText(fullText, legalMoves);

    // We do not attempt to parse tokens here; set to null for consistency
    const tokensIn: number | null = null;
    const tokensOut: number | null = null;

    logger.info("LLM streamed text captured", {
      length: fullText.length,
      hasMove: Boolean(extractedMove),
    });

    return {
      responseTime,
      move: extractedMove ?? null,
      tokensIn,
      tokensOut,
      reasoning: null as string | null,
      confidence: null as number | null,
      rawResponse: fullText,
    };
  },
});

export type GetNextMoveStreamingTaskType = typeof GetNextMoveStreamingTask;
