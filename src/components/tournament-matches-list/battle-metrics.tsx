"use client";

import { Badge } from "@/components/ui/badge";
import { useMoves } from "@/hooks/use-moves";

interface BattleMetricsProps {
  battleId: string;
  className?: string;
}

interface BattleStats {
  totalMoves: number;
  totalPlayers: number;
  battleDuration: number;
  totalTokens: number;
  totalInvalidMoves: number;
}

export function BattleMetrics({
  battleId,
  className = "",
}: BattleMetricsProps) {
  const { data: moves } = useMoves(battleId);

  if (!battleId) {
    return (
      <div className={`text-center ${className}`}>
        <div className="terminal-text text-xs opacity-50">No battle data</div>
      </div>
    );
  }

  if (!moves || moves.length === 0) {
    return (
      <div className={`text-center ${className}`}>
        <div className="terminal-text text-xs opacity-50">No moves yet</div>
      </div>
    );
  }

  // Calculate battle-wide statistics
  const uniquePlayers = new Set(moves.map((move) => move.player_id));
  const firstMove = moves[0];
  const lastMove = moves[moves.length - 1];

  const battleDuration =
    firstMove && lastMove
      ? Math.round(
          (new Date(lastMove.created_at).getTime() -
            new Date(firstMove.created_at).getTime()) /
            1000 /
            60,
        ) // minutes
      : 0;

  const stats: BattleStats = moves.reduce(
    (acc: BattleStats, move) => ({
      totalMoves: acc.totalMoves + 1,
      totalPlayers: uniquePlayers.size,
      battleDuration,
      totalTokens:
        acc.totalTokens + (move.tokens_in || 0) + (move.tokens_out || 0),
      totalInvalidMoves: acc.totalInvalidMoves + (move.is_valid ? 0 : 1),
    }),
    {
      totalMoves: 0,
      totalPlayers: 0,
      battleDuration: 0,
      totalTokens: 0,
      totalInvalidMoves: 0,
    } as BattleStats,
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs terminal-text">
          🎯 {stats.totalMoves} total moves
        </Badge>

        <Badge variant="outline" className="text-xs terminal-text">
          ⏱️ {stats.battleDuration}m
        </Badge>

        {stats.totalInvalidMoves > 0 && (
          <Badge variant="destructive" className="text-xs">
            ⚠️ {stats.totalInvalidMoves} invalid
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="terminal-text opacity-70">
          <div>Total Tokens: {stats.totalTokens.toLocaleString()}</div>
          <div>Players: {stats.totalPlayers}</div>
        </div>
        <div className="terminal-text opacity-70">
          <div>
            Moves/Player: {Math.round(stats.totalMoves / stats.totalPlayers)}
          </div>
          <div>
            Battle Quality: {stats.totalInvalidMoves === 0 ? "Perfect" : "Fair"}
          </div>
        </div>
      </div>
    </div>
  );
}
