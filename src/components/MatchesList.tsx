"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BattleSelect, PlayerSelect } from "@/db/schema";

type MatchData = BattleSelect & {
  white_player: PlayerSelect | null | undefined;
  black_player: PlayerSelect | null | undefined;
};

interface MatchesListProps {
  matches: MatchData[] | undefined;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

function getOutcomeDisplay(match: MatchData) {
  if (!match.outcome) {
    return { text: "In Progress", variant: "secondary" as const, icon: "⏳" };
  }
  
  if (match.outcome === "draw") {
    return { text: "Draw", variant: "outline" as const, icon: "🤝" };
  }
  
  if (match.winner === "white") {
    return { text: "White Wins", variant: "default" as const, icon: "♔" };
  }
  
  if (match.winner === "black") {
    return { text: "Black Wins", variant: "default" as const, icon: "♛" };
  }
  
  return { text: "Unknown", variant: "secondary" as const, icon: "❓" };
}

function getRoundDisplay(match: MatchData) {
  if (match.tournament_round && match.tournament_round_position !== null) {
    return `Round ${match.tournament_round} - Match ${match.tournament_round_position + 1}`;
  }
  return "Tournament Match";
}

export function MatchesList({ 
  matches, 
  title = "Matches", 
  emptyMessage = "No matches available yet.",
  className = ""
}: MatchesListProps) {
  if (!matches || matches.length === 0) {
    return (
      <Card className={`terminal-card terminal-border ${className}`}>
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-xl font-mono">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="terminal-text opacity-70 text-lg mb-2">⚔️</div>
            <div className="terminal-text opacity-80">{emptyMessage}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group matches by round for better organization
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.tournament_round || 0;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchData[]>);

  const sortedRounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card className={`terminal-card terminal-border ${className}`}>
      <CardHeader>
        <CardTitle className="terminal-text terminal-glow text-xl font-mono">
          {title}
        </CardTitle>
        <div className="terminal-text text-sm opacity-70">
          {matches.length} match{matches.length !== 1 ? 'es' : ''} total
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedRounds.map(round => (
          <div key={round} className="space-y-3">
            {/* Round Header */}
            {sortedRounds.length > 1 && (
              <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                <span className="terminal-text text-lg font-mono">
                  Round {round || 1}
                </span>
                <Badge variant="outline" className="terminal-text text-xs">
                  {matchesByRound[round].length} matches
                </Badge>
              </div>
            )}
            
            {/* Matches Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchesByRound[round]
                .sort((a, b) => (a.tournament_round_position || 0) - (b.tournament_round_position || 0))
                .map((match) => {
                  const outcome = getOutcomeDisplay(match);
                  const roundInfo = getRoundDisplay(match);
                  
                  return (
                    <Link
                      key={match.id}
                      href={`/battles/${match.id}`}
                      className="block group"
                    >
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
                            {/* White Player */}
                            <div className="flex items-center gap-2 p-2 rounded border border-gray-700/30">
                              <span className="text-white text-lg">♔</span>
                              <div className="flex-1 min-w-0">
                                <div className="terminal-text text-sm font-mono truncate">
                                  {match.white_player?.model_id || "Unknown"}
                                </div>
                                <div className="terminal-text text-xs opacity-60">
                                  White
                                </div>
                              </div>
                            </div>
                            
                            {/* VS Divider */}
                            <div className="text-center">
                              <span className="terminal-text text-sm opacity-70 font-mono">VS</span>
                            </div>
                            
                            {/* Black Player */}
                            <div className="flex items-center gap-2 p-2 rounded border border-gray-700/30">
                              <span className="text-white text-lg">♛</span>
                              <div className="flex-1 min-w-0">
                                <div className="terminal-text text-sm font-mono truncate">
                                  {match.black_player?.model_id || "Unknown"}
                                </div>
                                <div className="terminal-text text-xs opacity-60">
                                  Black
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Outcome */}
                          <div className="text-center pt-2 border-t border-gray-700/30">
                            <Badge variant={outcome.variant} className="terminal-text">
                              {outcome.icon} {outcome.text}
                            </Badge>
                          </div>
                          
                          {/* Battle ID (for debugging) */}
                          <div className="text-center">
                            <div className="terminal-text text-xs opacity-50 font-mono">
                              {match.id.slice(-8)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
