"use client";

import { useParams } from "next/navigation";
import React from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";
import {
  useRealtimeRunsWithTag,
  useRealtimeRunWithStreams,
} from "@trigger.dev/react-hooks";

import type { GetNextMoveStreamingTaskType } from "@/trigger/get-next-move-streaming.task";

import {
  AIModelsCollection,
  MovesCollection,
  PlayersCollection,
} from "@/db/electric";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  } = useLiveQuery(
    (q) =>
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
    [playerId],
  );

  const { data: moves } = useLiveQuery(
    (q) =>
      q
        .from({
          move: MovesCollection,
        })
        .where(({ move }) => eq(move.player_id, playerId))
        .where(({ move }) => eq(move.battle_id, battle_id)),
    [playerId, battle_id],
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

  // Realtime streamed text from Trigger.dev for this player
  const playerTag = React.useMemo(
    () => (color === "WHITE" ? "player:white" : "player:black"),
    [color],
  );

  // Acquire access token from backend (kept simple: assumes public or server issues token elsewhere)
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      try {
        const res = await fetch(`/api/trigger/token?battleId=${battle_id}`);
        if (!res.ok) return;
        const data = (await res.json()) as { token?: string };
        if (!cancelled) setAccessToken(data.token ?? null);
      } catch {
        // ignore
      }
    }
    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [battle_id]);

  // Defer realtime subscriptions until we have a token by delegating to a child component
  const streamedPanel = React.useMemo(() => {
    if (!accessToken) {
      return null;
    }
    return (
      <PlayerRunStreamViewer
        accessToken={accessToken}
        battleTag={`battle:${battle_id}`}
        playerTag={playerTag}
      />
    );
  }, [accessToken, battle_id, playerTag]);

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

        {streamedPanel}
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

function PlayerRunStreamViewer({
  accessToken,
  battleTag,
  playerTag,
}: {
  accessToken: string;
  battleTag: string;
  playerTag: string;
}) {
  // Safe to mount hooks here because token is guaranteed
  const { runs } = useRealtimeRunsWithTag(battleTag, {
    accessToken,
  });

  const latestRunId = React.useMemo(() => {
    const latest = runs
      .filter((r) => r.tags?.includes(playerTag))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )[0];
    return latest?.id ?? null;
  }, [runs, playerTag]);

  const { run: latestRun, streams } = useRealtimeRunWithStreams<
    GetNextMoveStreamingTaskType,
    { llm: string }
  >(latestRunId ?? undefined, { accessToken });

  const streamedText = React.useMemo(() => {
    const llmChunks = streams?.llm as string[] | undefined;
    if (Array.isArray(llmChunks) && llmChunks.length > 0) {
      return llmChunks.join("");
    }

    if (
      latestRun?.output &&
      typeof latestRun.output === "object" &&
      "rawResponse" in latestRun.output &&
      typeof (latestRun.output as { rawResponse?: unknown }).rawResponse ===
        "string"
    ) {
      return (latestRun.output as { rawResponse?: string })
        .rawResponse as string;
    }
    return latestRun ? `Status: ${latestRun.status}` : "";
  }, [streams, latestRun]);

  // Auto-scroll the container to bottom on new chunks
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && streamedText !== undefined) {
      el.scrollTop = el.scrollHeight;
    }
  }, [streamedText]);

  if (!latestRunId && !streamedText) return null;

  return (
    <div className="mt-3 p-2 rounded border border-terminal-border/60 bg-terminal-card/60">
      <div
        ref={scrollRef}
        className="terminal-text text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-auto"
      >
        {streamedText}
      </div>
    </div>
  );
}
