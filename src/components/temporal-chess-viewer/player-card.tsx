"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { useParams } from "next/navigation";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AIModelsCollection,
  MovesCollection,
  PlayersCollection,
} from "@/db/electric";
import { cn } from "@/lib/utils";

export function PlayerCard({
  playerId,
  color,
  isActive,
}: {
  playerId: string;
  color: "WHITE" | "BLACK";
  isActive: boolean;
}) {
  const { battle_id } = useParams<{ battle_id: string }>();
  const {
    data: [player],
  } = useLiveQuery((q) =>
    q
      .from({
        player: PlayersCollection,
      })
      .leftJoin({ model: AIModelsCollection }, ({ player, model }) =>
        eq(player.model_id, model.canonical_id),
      )
      .where(({ player }) => eq(player.id, playerId))
      .select(({ model, player }) => ({
        ...player,
        model,
      })),
  );

  const { data: moves } = useLiveQuery((q) =>
    q
      .from({
        move: MovesCollection,
      })
      .where(({ move }) => eq(move.player_id, playerId))
      .where(({ move }) => eq(move.battle_id, battle_id)),
  );

  const totalMoves = React.useMemo(() => {
    return moves.length;
  }, [moves]);

  const duration = React.useMemo(() => {
    if (totalMoves === 0) return 0;
    return moves.reduce((acc, move) => acc + (move.response_time ?? 0), 0);
  }, [moves, totalMoves]);

  const averageDuration = React.useMemo(() => {
    if (totalMoves === 0) return 0;
    return Math.round(duration / totalMoves);
  }, [duration, totalMoves]);

  const invalidMoves = React.useMemo(() => {
    if (totalMoves === 0) return 0;
    return moves.filter((move) => !move.is_valid).length;
  }, [totalMoves, moves]);

  const outputTokenCount = React.useMemo(() => {
    if (totalMoves === 0) return 0;
    return moves.reduce((acc, move) => acc + (move.tokens_out ?? 0), 0);
  }, [totalMoves, moves]);

  if (!player) {
    return playerId;
  }

  return (
    <Card
      className={cn("terminal-card terminal-border py-1 px-2", {
        "ring-2 ring-terminal-accent": isActive,
      })}
    >
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              isActive
                ? "text-primary-foreground"
                : "text-secondary-foreground",
            )}
          >
            {color === "WHITE" ? "♔" : "♛"} {color}
          </Badge>

          {player.model?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            // biome-ignore lint/performance/noImgElement: necessary for provider logos
            <img
              src={player.model.logo_url}
              alt={player.model.name}
              className="h-8 w-8 rounded"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-terminal-border flex items-center justify-center text-sm opacity-70">
              🧠
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="terminal-text font-mono text-sm font-semibold truncate">
              {player.model?.name ?? player.model?.canonical_id}
            </div>
            {player.model?.provider && (
              <div className="terminal-text text-xs opacity-70 capitalize">
                {player.model.provider}
              </div>
            )}
            {player.model?.description && (
              <div className="terminal-text text-xs opacity-60 line-clamp-2 mt-1">
                {player.model.description}
              </div>
            )}
          </div>
        </div>
        <div className="terminal-text text-xs opacity-60 mt-1">
          {totalMoves} moves
        </div>
        <div className="terminal-text text-xs opacity-60 mt-1">
          {averageDuration}ms average move duration (
          {formatDurationToHumanReadable(averageDuration)})
        </div>
        <div className="terminal-text text-xs opacity-60 mt-1">
          {invalidMoves} invalid moves
        </div>
        <div className="terminal-text text-xs opacity-60 mt-1">
          {duration}ms total duration ({formatDurationToHumanReadable(duration)}
          )
        </div>
        <div className="terminal-text text-xs opacity-60 mt-1">
          {outputTokenCount} tokens out
        </div>
      </CardContent>
    </Card>
  );
}

function formatDurationToHumanReadable(duration: number) {
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${Math.round(duration / 1000)}s`;
  } else if (duration < 3600000) {
    return `${Math.round(duration / 60000)}m`;
  } else {
    return `${Math.round(duration / 3600000)}h`;
  }
}
