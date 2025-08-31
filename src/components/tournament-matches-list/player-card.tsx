"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { PlayersCollection } from "@/db/electric";
import { ModelInfo } from "./model-info";
import { PlayerMetrics } from "./player-metrics";

interface PlayerCardProps {
  playerId: string;
  battleId: string;
  color: "white" | "black";
  isWinner?: boolean;
  className?: string;
}

export function PlayerCard({
  playerId,
  battleId,
  color,
  isWinner = false,
  className = "",
}: PlayerCardProps) {
  // Skip query if no playerId
  const { data: players } = useLiveQuery((q) =>
    q
      .from({ player: PlayersCollection })
      .where(({ player }) => eq(player.id, playerId))
      .select(({ player }) => ({ ...player })),
  );

  const player = players?.[0];

  if (!playerId || !player) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded border border-gray-700/30 ${className}`}
      >
        <span className="text-white text-lg">
          {color === "white" ? "♔" : "♛"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="terminal-text text-sm font-mono">
            {!playerId ? "Unknown Player" : "Loading..."}
          </div>
          <div className="terminal-text text-xs opacity-60">
            {color === "white" ? "White" : "Black"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded border transition-colors ${
        isWinner ? "border-green-500/50 bg-green-500/10" : "border-gray-700/30"
      } ${className}`}
    >
      <span className="text-white text-lg">
        {color === "white" ? "♔" : "♛"}
      </span>

      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <ModelInfo modelId={player.model_id} />
          <div className="terminal-text text-xs opacity-60 mt-1">
            {color === "white" ? "White" : "Black"}
            {isWinner && " 👑"}
          </div>
        </div>

        {/* Player-specific metrics */}
        <PlayerMetrics battleId={battleId} playerId={playerId} color={color} />
      </div>
    </div>
  );
}
