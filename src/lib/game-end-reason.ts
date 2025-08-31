export const GAME_END_REASONS = [
  "checkmate",
  "stalemate",
  "draw",
  "resignation",
  "timeout",
  "agreement",
  "forfeit_invalid_moves",
  "insufficient_material",
  "threefold_repetition",
] as const;

export type GameEndReason = (typeof GAME_END_REASONS)[number];
