"use client";

import type { BattleSelect } from "@/db/schema";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MatchCard } from "./match-card";

interface MatchesListProps {
  matches: BattleSelect[] | undefined;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export function MatchesList({
  matches,
  title = "Matches",
  emptyMessage = "No matches available yet.",
  className = "",
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
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const round = match.tournament_round || 0;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    },
    {} as Record<number, BattleSelect[]>,
  );

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
          {matches.length} match{matches.length !== 1 ? "es" : ""} total
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedRounds.map((round) => (
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
                .sort(
                  (a, b) =>
                    (a.tournament_round_position || 0) -
                    (b.tournament_round_position || 0),
                )
                .map((match, index) => (
                  <MatchCard
                    key={match.id || `match-${round}-${index}`}
                    match={match}
                  />
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
