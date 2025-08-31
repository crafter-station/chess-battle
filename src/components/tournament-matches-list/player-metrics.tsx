"use client";

import { Badge } from "@/components/ui/badge";

import { useMoves } from "@/hooks/use-moves";

interface PlayerMetricsProps {
  battleId: string;
  playerId: string;
  color: "white" | "black";
  className?: string;
}

interface PlayerStats {
  totalMoves: number;
  validMoves: number;
  invalidMoves: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgResponseTime: number;
  avgConfidence: number;
  accuracy: number;
}

export function PlayerMetrics({
  battleId,
  playerId,
  color,
  className = "",
}: PlayerMetricsProps) {
  const { data: moves } = useMoves(battleId);

  if (!battleId || !playerId) {
    return (
      <div className={`text-center ${className}`}>
        <div className="terminal-text text-xs opacity-50">No data</div>
      </div>
    );
  }

  // Filter moves for this specific player
  const playerMoves =
    moves?.filter((move) => move.player_id === playerId) || [];

  if (playerMoves.length === 0) {
    return (
      <div className={`text-center ${className}`}>
        <div className="terminal-text text-xs opacity-50">No moves yet</div>
      </div>
    );
  }

  const stats: PlayerStats = playerMoves.reduce(
    (acc: PlayerStats, move) => ({
      totalMoves: acc.totalMoves + 1,
      validMoves: acc.validMoves + (move.is_valid ? 1 : 0),
      invalidMoves: acc.invalidMoves + (move.is_valid ? 0 : 1),
      totalTokensIn: acc.totalTokensIn + (move.tokens_in || 0),
      totalTokensOut: acc.totalTokensOut + (move.tokens_out || 0),
      avgResponseTime: acc.avgResponseTime + (move.response_time || 0),
      avgConfidence: acc.avgConfidence + (move.confidence || 0),
      accuracy: 0, // Will calculate after
    }),
    {
      totalMoves: 0,
      validMoves: 0,
      invalidMoves: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      avgResponseTime: 0,
      avgConfidence: 0,
      accuracy: 0,
    } as PlayerStats,
  );

  // Calculate averages
  stats.avgResponseTime =
    stats.totalMoves > 0
      ? Math.round(stats.avgResponseTime / stats.totalMoves)
      : 0;

  stats.avgConfidence =
    stats.totalMoves > 0
      ? Math.round(stats.avgConfidence / stats.totalMoves)
      : 0;

  stats.accuracy =
    stats.totalMoves > 0
      ? Math.round((stats.validMoves / stats.totalMoves) * 100)
      : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs terminal-text">
          {color === "white" ? "♔" : "♛"} {stats.totalMoves} moves
        </Badge>

        {stats.invalidMoves > 0 && (
          <Badge variant="destructive" className="text-xs">
            ❌ {stats.invalidMoves}
          </Badge>
        )}

        <Badge
          variant={
            stats.accuracy >= 90
              ? "default"
              : stats.accuracy >= 70
                ? "secondary"
                : "destructive"
          }
          className="text-xs"
        >
          📊 {stats.accuracy}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="terminal-text opacity-70">
          <div>
            Tokens:{" "}
            {(stats.totalTokensIn + stats.totalTokensOut).toLocaleString()}
          </div>
          <div>Response: {stats.avgResponseTime}ms</div>
        </div>
        <div className="terminal-text opacity-70">
          <div>Confidence: {stats.avgConfidence}%</div>
          <div>
            Valid: {stats.validMoves}/{stats.totalMoves}
          </div>
        </div>
      </div>
    </div>
  );
}
