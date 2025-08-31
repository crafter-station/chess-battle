"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { Chess } from "chess.js";
import { useParams } from "next/navigation";
import * as React from "react";
import { ChessBoard } from "@/components/temporal-chess-viewer/chess-board";
import { MoveHistory } from "@/components/temporal-chess-viewer/move-history";
import { MoveInfo } from "@/components/temporal-chess-viewer/move-info";
import { NavigationControls } from "@/components/temporal-chess-viewer/navigation-controls";
import { PlayerCard } from "@/components/temporal-chess-viewer/player-card";
import { BattlesCollection, PlayersCollection } from "@/db/electric";
import { useCurrentMove } from "@/hooks/use-current-move";

export function TemporalChessViewer() {
  const { battle_id } = useParams<{ battle_id: string }>();

  const { data: battleData } = useLiveQuery((q) =>
    q
      .from({ battle: BattlesCollection })
      .leftJoin(
        { white_player: PlayersCollection },
        ({ battle, white_player }) =>
          eq(battle.white_player_id, white_player.id),
      )
      .leftJoin(
        { black_player: PlayersCollection },
        ({ battle, black_player }) =>
          eq(battle.black_player_id, black_player.id),
      )
      .where(({ battle }) => eq(battle.id, battle_id))
      .select(({ battle, white_player, black_player }) => ({
        ...battle,
        white_player,
        black_player,
      })),
  );

  const currentMove = useCurrentMove();

  const nextPlayerColor = React.useMemo(() => {
    if (!currentMove) {
      return "white";
    }
    return new Chess(currentMove.state).turn() === "w" ? "white" : "black";
  }, [currentMove]);

  const battle = battleData?.[0];

  if (!battle) {
    return (
      <div className="flex items-center justify-center h-96 terminal-card rounded-lg">
        <div className="terminal-text text-lg text-muted-foreground">
          Battle not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 terminal-card crt-flicker">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Player Information */}

        {/* Main Chess Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2 flex flex-col justify-start items-center">
            {battle.black_player?.id && (
              <PlayerCard
                color="BLACK"
                playerId={battle.black_player.id}
                isActive={nextPlayerColor === "black"}
              />
            )}
            <ChessBoard />
            {battle.white_player?.id && (
              <PlayerCard
                color="WHITE"
                playerId={battle.white_player.id}
                isActive={nextPlayerColor === "white"}
              />
            )}
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Current Move Info */}
            <MoveInfo />

            {/* Navigation Controls */}
            <NavigationControls />

            {/* Move History */}
            <MoveHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
