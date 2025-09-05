import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { simulateReadableStream, streamText } from "ai";
import { Chess } from "chess.js";
import { z } from "zod";

// Interface for streaming result (both real and simulated)
interface StreamingResult {
  textStream: ReadableStream<string>;
  onFinish?: (
    callback: (event: {
      usage?: { inputTokens?: number; outputTokens?: number };
    }) => void,
  ) => void;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// Heuristic regexes to extract a SAN move from arbitrary text
// Note: We intentionally do NOT include a "Final Answer" pattern here
// because we handle it explicitly before this fallback scan.
const SAN_REGEXES: RegExp[] = [
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

  // 1) If there are "Final Answer: <move>" occurrences, prefer the last one.
  const allFinals = [
    ...text.matchAll(/Final\s*Answer\s*:\s*([A-Za-z0-9=+#-]+)/gi),
  ];
  const lastFinal = allFinals.at(-1)?.[1];
  if (lastFinal) {
    const candidate = lastFinal.trim();
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

async function simulateStreamingAIResponse(
  chess: Chess,
  _playerModelId: string,
): Promise<StreamingResult> {
  const chessMoves = chess.moves();
  const validMove = chessMoves[Math.floor(Math.random() * chessMoves.length)];

  // Create different types of mock responses similar to the original task
  const responseTypes = ["normal", "reasoning", "response"];
  const responseType =
    responseTypes[Math.floor(Math.random() * responseTypes.length)];

  let mockText = "";

  switch (responseType) {
    case "reasoning":
      mockText = `Looking at this position, I need to evaluate the key factors. The center control is important, and piece development should be prioritized. The move ${validMove} appears to be the strongest option here as it improves my position while maintaining pressure.\n\nFinal Answer: ${validMove}`;
      break;
    case "response":
      mockText = `This position requires careful analysis. Material is balanced, but positional factors favor active piece play. I can see that ${validMove} creates tactical opportunities while securing my king safety. This move also opens up future possibilities for coordinated attacks.\n\nFinal Answer: ${validMove}`;
      break;
    default:
      mockText = `I'll analyze this position carefully. The move ${validMove} looks promising as it controls center squares and improves piece coordination.\n\nFinal Answer: ${validMove}`;
  }

  // Split text into chunks for streaming simulation
  const words = mockText.split(" ");
  const chunks: string[] = [];

  // Create chunks of 2-4 words each
  for (let i = 0; i < words.length; i += Math.floor(Math.random() * 3) + 2) {
    const chunkWords = words.slice(i, i + Math.floor(Math.random() * 3) + 2);
    chunks.push(
      chunkWords.join(" ") + (i + chunkWords.length < words.length ? " " : ""),
    );
  }

  // Generate mock usage statistics
  const inputTokens = Math.floor(Math.random() * 100) + 50;
  const outputTokens = Math.floor(Math.random() * 200) + 100;

  // Create simulated stream with realistic delays
  const textStream = simulateReadableStream({
    chunks: chunks,
    chunkDelayInMs: 100 + Math.floor(Math.random() * 200), // 100-300ms between chunks
  });

  // Return object structure compatible with streamText result
  return {
    textStream,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
    onFinish: (
      callback: (event: {
        usage?: { inputTokens?: number; outputTokens?: number };
      }) => void,
    ) => {
      // Simulate the onFinish callback after stream completes
      setTimeout(
        () => {
          callback({
            usage: {
              inputTokens,
              outputTokens,
            },
          });
        },
        chunks.length * 200 + 1000,
      ); // Rough estimate of when stream will finish
    },
  };
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

    // Track token usage captured on stream finish (if provider supports it)
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;

    // biome-ignore lint/suspicious/noExplicitAny: streaming result
    let result: any;

    if (process.env.NODE_ENV === "development") {
      logger.info(`🔍 Simulating streaming AI response for ${playerModelId}`);
      result = await simulateStreamingAIResponse(chess, playerModelId);

      // In simulation mode, set token usage immediately since we know the values
      if (result.usage) {
        tokensIn = result.usage.inputTokens;
        tokensOut = result.usage.outputTokens;
      }
    } else {
      // Stream the model's response
      result = streamText({
        model: playerModelId,
        messages: constructMessages(chess, payload.lastInvalidMoves),
        // Capture usage metrics when the stream completes
        onFinish: (event) => {
          // Some providers expose usage; if present, record it
          tokensIn = event.usage?.inputTokens ?? null;
          tokensOut = event.usage?.outputTokens ?? null;
        },
        // Keep system/user messages simple and provider-agnostic
        // No provider-specific options here to support multiple vendors
      });
    }

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

    // tokensIn/tokensOut may remain null if the provider doesn't return usage

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
