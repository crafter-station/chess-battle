"use client";

import Link from "next/link";

import type { BattleSelect } from "@/db/schema";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { BattleMetrics } from "./battle-metrics";
import { PlayerCard } from "./player-card";

interface MatchCardProps {
  match: BattleSelect;
  className?: string;
}

function getOutcomeDisplay(match: BattleSelect) {
  if (!match.outcome) {
    return {
      text: "In Progress",
      variant: "secondary" as const,
      icon: "⏳",
      reason: null,
    };
  }

  const endReason = match.game_end_reason || "unknown";
  const reasonDisplay = getEndReasonDisplay(endReason);

  if (match.outcome === "draw") {
    // For draws, show who the technical winner is (if any)
    const technicalWinner = match.winner
      ? `Technical: ${match.winner === "white" ? "♔ White" : "♛ Black"}`
      : "True Draw";

    return {
      text: "Draw",
      variant: "outline" as const,
      icon: "🤝",
      reason: reasonDisplay,
      technicalWinner,
    };
  }

  if (match.winner === "white") {
    return {
      text: "White Wins",
      variant: "default" as const,
      icon: "♔",
      reason: reasonDisplay,
      technicalWinner: null,
    };
  }

  if (match.winner === "black") {
    return {
      text: "Black Wins",
      variant: "default" as const,
      icon: "♛",
      reason: reasonDisplay,
      technicalWinner: null,
    };
  }

  return {
    text: "Unknown",
    variant: "secondary" as const,
    icon: "❓",
    reason: reasonDisplay,
    technicalWinner: null,
  };
}

function getEndReasonDisplay(reason: string): string {
  const reasonMap: Record<string, string> = {
    checkmate: "♔ Checkmate",
    stalemate: "🤝 Stalemate",
    draw: "🤝 Draw Agreement",
    resignation: "🏳️ Resignation",
    timeout: "⏰ Time Out",
    agreement: "🤝 Mutual Agreement",
    forfeit_invalid_moves: "❌ Invalid Moves",
    insufficient_material: "🔹 Insufficient Material",
    threefold_repetition: "🔄 Threefold Repetition",
  };

  return reasonMap[reason] || `❓ ${reason}`;
}

function getRoundDisplay(match: BattleSelect) {
  if (match.tournament_round && match.tournament_round_position !== null) {
    return `Round ${match.tournament_round} - Match ${
      match.tournament_round_position + 1
    }`;
  }
  return "Tournament Match";
}

export function MatchCard({ match, className = "" }: MatchCardProps) {
  // Defensive check for match data
  if (!match || !match.id) {
    return (
      <div className={`block group ${className}`}>
        <Card className="terminal-card terminal-border h-full">
          <CardContent className="p-4 text-center">
            <div className="terminal-text text-sm opacity-50">
              Loading match data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outcome = getOutcomeDisplay(match);
  const roundInfo = getRoundDisplay(match);

  return (
    <Link href={`/battles/${match.id}`} className={`block group ${className}`}>
      <Card className="terminal-card terminal-border h-full transition-all duration-200 group-hover:shadow-lg group-hover:shadow-green-500/20 group-hover:border-green-500/50">
        <CardContent className="p-4 space-y-3">
          {/* Round Info */}
          <div className="text-center">
            <Badge variant="outline" className="terminal-text text-xs">
              {roundInfo}
            </Badge>
          </div>

          {/* Players */}
          <div className="space-y-2">
            <PlayerCard
              playerId={match.white_player_id || ""}
              battleId={match.id || ""}
              color="white"
              isWinner={match.winner === "white"}
            />

            {/* VS Divider */}
            <div className="text-center">
              <span className="terminal-text text-sm opacity-70 font-mono">
                VS
              </span>
            </div>

            <PlayerCard
              playerId={match.black_player_id || ""}
              battleId={match.id || ""}
              color="black"
              isWinner={match.winner === "black"}
            />
          </div>

          {/* Battle Metrics */}
          <div className="pt-2 border-t border-gray-700/30">
            <BattleMetrics battleId={match.id || ""} />
          </div>

          {/* Outcome */}
          <div className="text-center pt-2 border-t border-gray-700/30 space-y-2">
            <Badge
              variant={outcome.variant}
              className={cn(
                "!text-primary-foreground",
                outcome.variant === "outline" && "!text-primary",
              )}
            >
              {outcome.icon} {outcome.text}
            </Badge>

            {/* Game End Reason */}
            {outcome.reason && (
              <div className="terminal-text text-xs opacity-70">
                {outcome.reason}
              </div>
            )}

            {/* Technical Winner for Draws */}
            {outcome.technicalWinner && (
              <div className="terminal-text text-xs opacity-60">
                {outcome.technicalWinner}
              </div>
            )}
          </div>

          {/* Battle ID (for debugging) */}
          <div className="text-center">
            <div className="terminal-text text-xs opacity-50 font-mono">
              {match.id ?? "Unknown"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
