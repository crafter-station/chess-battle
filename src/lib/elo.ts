export type ELORating = {
  rating: number;
  gamesPlayed: number;
  provisional: boolean;
  kFactor: number;
};

export type ELOCalculation = {
  expectedScore: number;
  actualScore: number;
  ratingChange: number;
  newRating: number;
};

export function calculateExpectedScore(
  playerRating: number,
  opponentRating: number,
): number {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

export function calculateKFactor(
  gamesPlayed: number,
  currentRating: number,
): number {
  if (gamesPlayed < 10) return 40;
  if (gamesPlayed < 30) return 32;
  if (currentRating >= 2000) return 16;
  return 24;
}

export function updateRatings(
  white: ELORating,
  black: ELORating,
  result: "white_win" | "black_win" | "draw",
): { white: ELOCalculation; black: ELOCalculation } {
  const whiteScore = result === "white_win" ? 1 : result === "draw" ? 0.5 : 0;
  const blackScore = 1 - whiteScore;

  const whiteExpected = calculateExpectedScore(white.rating, black.rating);
  const blackExpected = calculateExpectedScore(black.rating, white.rating);

  const whiteChange = white.kFactor * (whiteScore - whiteExpected);
  const blackChange = black.kFactor * (blackScore - blackExpected);

  return {
    white: {
      expectedScore: whiteExpected,
      actualScore: whiteScore,
      ratingChange: whiteChange,
      newRating: Math.round(white.rating + whiteChange),
    },
    black: {
      expectedScore: blackExpected,
      actualScore: blackScore,
      ratingChange: blackChange,
      newRating: Math.round(black.rating + blackChange),
    },
  };
}
