"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameEndReason } from "@/lib/game-end-reason";

interface GameResultProps {
  outcome: "win" | "draw" | null;
  winner: "white" | "black" | null;
  gameEndReason: GameEndReason | null;
  whitePlayerModel?: string;
  blackPlayerModel?: string;
}

interface GameEndExplanation {
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  color: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

const getGameEndExplanation = (
  reason: GameEndReason | null,
  outcome: "win" | "draw" | null,
  winner: "white" | "black" | null,
): GameEndExplanation => {
  switch (reason) {
    case "checkmate":
      return {
        title: "CHECKMATE",
        shortDescription: `${winner === "white" ? "White" : "Black"} wins decisively`,
        fullDescription: `The ${winner === "white" ? "black" : "white"} king is under attack and has no legal moves to escape capture. This is the most decisive way to win in chess.`,
        icon: "♔",
        color: "text-green-400",
        badgeVariant: "default",
      };

    case "stalemate":
      if (winner) {
        return {
          title: "STALEMATE + TIEBREAKER",
          shortDescription: `Draw by stalemate, ${winner} wins tiebreaker`,
          fullDescription: `The game ended in stalemate (no legal moves but king not in check), resulting in a positional draw. However, ${winner === "white" ? "White" : "Black"} wins the technical victory due to faster average response time.`,
          icon: "⚖️",
          color: "text-blue-400",
          badgeVariant: "outline",
        };
      }
      return {
        title: "STALEMATE",
        shortDescription: "True draw - no legal moves available",
        fullDescription:
          "The player to move has no legal moves available, but their king is not in check. This results in a draw according to chess rules.",
        icon: "=",
        color: "text-yellow-400",
        badgeVariant: "secondary",
      };

    case "draw":
      return {
        title: "DRAW AGREED",
        shortDescription: "Mutual agreement to draw",
        fullDescription:
          "Both players have agreed to end the game in a draw, typically when neither side can make progress towards victory.",
        icon: "🤝",
        color: "text-yellow-400",
        badgeVariant: "secondary",
      };

    case "resignation":
      return {
        title: "RESIGNATION",
        shortDescription: `${winner === "white" ? "Black" : "White"} resigned`,
        fullDescription: `The ${winner === "white" ? "black" : "white"} player has resigned, acknowledging that their position is hopeless and continuing would be futile.`,
        icon: "🏳️",
        color: "text-green-400",
        badgeVariant: "default",
      };

    case "timeout":
      if (outcome === "draw") {
        return {
          title: "TIMEOUT DRAW",
          shortDescription: "Game exceeded move limit",
          fullDescription:
            "The game was terminated after reaching the maximum number of moves (100). Since neither player achieved victory, the game ended in a draw.",
          icon: "⏰",
          color: "text-yellow-400",
          badgeVariant: "secondary",
        };
      }
      return {
        title: "TIMEOUT",
        shortDescription: `${winner === "white" ? "White" : "Black"} wins by timeout`,
        fullDescription: `The game was terminated due to timeout conditions. ${winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} was declared the winner based on position evaluation.` : "The game ended due to time constraints."}`,
        icon: "⏰",
        color: "text-orange-400",
        badgeVariant: "destructive",
      };

    case "agreement":
      return {
        title: "MUTUAL AGREEMENT",
        shortDescription: "Both players agreed to draw",
        fullDescription:
          "Both players have mutually agreed to end the game in a draw, recognizing that the position offers equal chances for both sides.",
        icon: "🤝",
        color: "text-yellow-400",
        badgeVariant: "secondary",
      };

    case "forfeit_invalid_moves":
      return {
        title: "FORFEIT",
        shortDescription: `${winner === "white" ? "Black" : "White"} disqualified`,
        fullDescription: `The ${winner === "white" ? "black" : "white"} player was disqualified for making too many invalid moves (10+ total). AI models must follow chess rules precisely to avoid forfeit.`,
        icon: "🚫",
        color: "text-green-400",
        badgeVariant: "destructive",
      };

    case "insufficient_material":
      if (winner) {
        return {
          title: "INSUFFICIENT MATERIAL + TIEBREAKER",
          shortDescription: `Draw by material, ${winner} wins tiebreaker`,
          fullDescription: `Neither player had enough pieces to deliver checkmate, resulting in a positional draw. However, ${winner === "white" ? "White" : "Black"} wins the technical victory due to faster average response time.`,
          icon: "⚖️",
          color: "text-blue-400",
          badgeVariant: "outline",
        };
      }
      return {
        title: "INSUFFICIENT MATERIAL",
        shortDescription: "Not enough pieces for checkmate",
        fullDescription:
          "Neither player has enough pieces left on the board to deliver checkmate. The game automatically ends in a draw.",
        icon: "♞",
        color: "text-yellow-400",
        badgeVariant: "secondary",
      };

    case "threefold_repetition":
      if (winner) {
        return {
          title: "REPETITION + TIEBREAKER",
          shortDescription: `Draw by repetition, ${winner} wins tiebreaker`,
          fullDescription: `The same position occurred three times, resulting in a positional draw. However, ${winner === "white" ? "White" : "Black"} wins the technical victory due to faster average response time.`,
          icon: "⚖️",
          color: "text-blue-400",
          badgeVariant: "outline",
        };
      }
      return {
        title: "THREEFOLD REPETITION",
        shortDescription: "Same position repeated 3 times",
        fullDescription:
          "The same position has occurred three times during the game. This triggers an automatic draw according to chess rules.",
        icon: "↻",
        color: "text-yellow-400",
        badgeVariant: "secondary",
      };

    default:
      if (outcome === "draw") {
        return {
          title: winner ? "DRAW + TIEBREAKER" : "TRUE DRAW",
          shortDescription: winner
            ? `Positional draw, ${winner} wins tiebreaker`
            : "Equal performance by both players",
          fullDescription: winner
            ? `The game ended in a positional draw, but ${winner === "white" ? "White" : "Black"} wins the technical victory due to faster average response time.`
            : "The game ended in a true draw with both players performing equally in all measured criteria.",
          icon: "⚖️",
          color: winner ? "text-blue-400" : "text-yellow-400",
          badgeVariant: winner ? "outline" : "secondary",
        };
      }

      return {
        title: outcome === "win" ? "VICTORY" : "GAME OVER",
        shortDescription:
          outcome === "win" && winner
            ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} achieved victory`
            : "Chess battle concluded",
        fullDescription:
          outcome === "win" && winner
            ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} achieved victory in this chess battle.`
            : "The chess battle has concluded.",
        icon: "🏆",
        color: "text-green-400",
        badgeVariant: "default",
      };
  }
};

export function GameResult({
  outcome,
  winner,
  gameEndReason,
  whitePlayerModel,
  blackPlayerModel,
}: GameResultProps) {
  // Don't show if game is still in progress
  if (!outcome) {
    return null;
  }

  const explanation = getGameEndExplanation(gameEndReason, outcome, winner);
  const winnerModel =
    winner === "white"
      ? whitePlayerModel
      : winner === "black"
        ? blackPlayerModel
        : null;
  const isTiebreaker = winner && outcome === "draw";

  return (
    <Card className="terminal-card terminal-border">
      <CardHeader>
        <CardTitle className="terminal-text text-sm">GAME_RESULT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Result Header */}
        <div className="text-center space-y-2">
          <div className={`text-3xl ${explanation.color} terminal-glow`}>
            {explanation.icon}
          </div>
          <div
            className={`text-lg font-mono ${explanation.color} terminal-glow`}
          >
            {explanation.title}
          </div>
          <Badge variant={explanation.badgeVariant} className="terminal-text">
            {explanation.shortDescription}
          </Badge>
        </div>

        {/* Winner Information */}
        {winner && winnerModel && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="terminal-text text-xs opacity-70">
                {isTiebreaker ? "TECHNICAL_WINNER:" : "WINNER:"}
              </span>
              <span className={`terminal-text text-sm ${explanation.color}`}>
                {winner.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="terminal-text text-xs opacity-70">MODEL:</span>
              <span className="terminal-text text-sm opacity-90 truncate">
                {winnerModel}
              </span>
            </div>
          </div>
        )}

        {/* Tiebreaker Explanation */}
        {isTiebreaker && (
          <div className="p-3 rounded border border-dashed border-[var(--border)] bg-[var(--card)]/30">
            <div className="terminal-text text-xs opacity-70 mb-2 font-mono">
              TECHNICAL_WINNER_DEFINITION:
            </div>
            <div className="terminal-text text-xs opacity-90 leading-relaxed">
              When games end in positional draws, the winner is determined by{" "}
              <strong>average response time</strong>. The AI model with faster
              average decision-making wins the tiebreaker, demonstrating
              superior computational efficiency.
            </div>
          </div>
        )}

        {/* Full Explanation */}
        <div className="space-y-2">
          <div className="terminal-text text-xs opacity-70 uppercase tracking-wider">
            EXPLANATION
          </div>
          <div className="terminal-text text-sm opacity-90 leading-relaxed">
            {explanation.fullDescription}
          </div>
        </div>

        {/* Players Summary */}
        <div className="pt-3 border-t border-[var(--border)]/30">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="terminal-text opacity-70">WHITE</div>
              <div className="terminal-text opacity-90 truncate">
                {whitePlayerModel || "Unknown"}
              </div>
              {winner === "white" && (
                <div className="terminal-text text-green-400 text-[10px]">
                  ✓ {isTiebreaker ? "TECHNICAL" : "WINNER"}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="terminal-text opacity-70">BLACK</div>
              <div className="terminal-text opacity-90 truncate">
                {blackPlayerModel || "Unknown"}
              </div>
              {winner === "black" && (
                <div className="terminal-text text-green-400 text-[10px]">
                  ✓ {isTiebreaker ? "TECHNICAL" : "WINNER"}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
