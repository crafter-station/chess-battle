"use client";

import { useParams } from "next/navigation";
import * as React from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { Chess } from "chess.js";

import { BattlesCollection, PlayersCollection } from "@/db/electric";

import type { GameEndReason } from "@/lib/game-end-reason";

import { BattleTimer } from "@/components/temporal-chess-viewer/battle-timer";
import { ChessBoard } from "@/components/temporal-chess-viewer/chess-board";
import { GameResult } from "@/components/temporal-chess-viewer/game-result";
import { MoveHistory } from "@/components/temporal-chess-viewer/move-history";
import { MoveInfo } from "@/components/temporal-chess-viewer/move-info";
import { NavigationControls } from "@/components/temporal-chess-viewer/navigation-controls";
import { PlayerCard } from "@/components/temporal-chess-viewer/player-card";
import { BattleTimeout } from "@/components/temporal-chess-viewer/timeout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCurrentMove } from "@/hooks/use-current-move";
import { useMoves } from "@/hooks/use-moves";

// Collapsible indicator component
const CollapsibleIndicator = ({ isOpen }: { isOpen: boolean }) => (
  <span
    className={`terminal-text text-xs opacity-50 transition-transform duration-200 ${
      isOpen ? "rotate-180" : "rotate-0"
    }`}
  >
    ▼
  </span>
);

export function TemporalChessViewer() {
  const { battle_id } = useParams<{ battle_id: string }>();

  // Collapsible states for sidebar sections
  const [battleStatusOpen, setBattleStatusOpen] = React.useState(true);
  const [gameResultOpen, setGameResultOpen] = React.useState(false);
  const [navigationOpen, setNavigationOpen] = React.useState(true);
  const [moveInfoOpen, setMoveInfoOpen] = React.useState(false);
  const [moveHistoryOpen, setMoveHistoryOpen] = React.useState(false);

  const { data: battleData } = useLiveQuery(
    (q) =>
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
    [battle_id],
  );

  const currentMove = useCurrentMove();
  const { data: moves } = useMoves(battle_id);

  const nextPlayerColor = React.useMemo(() => {
    if (!currentMove) {
      return "white";
    }
    return new Chess(currentMove.state).turn() === "w" ? "white" : "black";
  }, [currentMove]);

  const battle = battleData?.[0];

  // Auto-open game result when battle is finished
  React.useEffect(() => {
    if (battle?.outcome) {
      setGameResultOpen(true);
    }
  }, [battle?.outcome]);

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
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Main Content Area */}
      <div className="flex flex-col p-2 sm:p-3 lg:p-4 min-w-0 lg:flex-1 lg:min-h-0 overflow-y-auto lg:overflow-y-hidden">
        <Tabs defaultValue="board" className="flex flex-col lg:flex-1">
          <TabsList className="grid w-full grid-cols-3 mb-2 lg:mb-4">
            <TabsTrigger value="board" className="text-xs lg:text-sm font-mono">
              🏆 BATTLE
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="text-xs lg:text-sm font-mono"
            >
              📊 ANALYSIS
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="text-xs lg:text-sm font-mono"
            >
              🤖 PLAYERS
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="board"
            className="flex flex-col mt-0 gap-1 sm:gap-2 lg:gap-3 lg:flex-1 lg:min-h-0"
          >
            {/* Black Player - Responsive */}
            {battle.black_player?.id && (
              <div className="flex-shrink-0">
                <PlayerCard
                  color="BLACK"
                  playerId={battle.black_player.id}
                  isActive={nextPlayerColor === "black"}
                />
              </div>
            )}

            {/* Chess Board Container - Fixed height on mobile, flex on desktop */}
            <div className="flex items-center justify-center py-2 lg:flex-1 lg:min-h-0">
              <div className="aspect-square w-full max-w-[min(100vw-2rem,300px)] sm:max-w-[min(100vw-4rem,400px)] lg:max-w-[min(50vw,60vh)]">
                <ChessBoard />
              </div>
            </div>

            {/* White Player - Responsive */}
            {battle.white_player?.id && (
              <div className="flex-shrink-0">
                <PlayerCard
                  color="WHITE"
                  playerId={battle.white_player.id}
                  isActive={nextPlayerColor === "white"}
                />
              </div>
            )}

            {/* Mobile Info Section - Only visible on mobile */}
            <div className="lg:hidden space-y-3 mt-4">
              {/* Battle Timer */}
              <div className="terminal-border rounded-lg p-3 bg-black/20">
                <BattleTimer
                  battle={{
                    ...battle,
                    game_end_reason:
                      battle.game_end_reason as GameEndReason | null,
                  }}
                  moves={moves}
                />
              </div>

              {/* Game Result */}
              <div>
                <GameResult
                  outcome={battle.outcome}
                  winner={battle.winner}
                  gameEndReason={battle.game_end_reason as GameEndReason | null}
                  whitePlayerModel={battle.white_player?.model_id}
                  blackPlayerModel={battle.black_player?.model_id}
                />
              </div>

              {/* Move Info */}
              <div>
                <MoveInfo />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Card className="terminal-card terminal-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono terminal-glow">
                      🧠 BATTLE STATISTICS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-2">
                        <div className="text-primary">● BLACK STATS</div>
                        {battle.black_player?.id && (
                          <div className="space-y-1 text-xs opacity-80">
                            <div>Model: {battle.black_player.model_id}</div>
                            <div>
                              Moves:{" "}
                              {
                                moves.filter(
                                  (m) =>
                                    m.player_id === battle.black_player?.id,
                                ).length
                              }
                            </div>
                            <div>
                              Avg Response:{" "}
                              {Math.round(
                                moves
                                  .filter(
                                    (m) =>
                                      m.player_id === battle.black_player?.id,
                                  )
                                  .reduce(
                                    (acc, m) => acc + (m.response_time ?? 0),
                                    0,
                                  ) /
                                  Math.max(
                                    1,
                                    moves.filter(
                                      (m) =>
                                        m.player_id === battle.black_player?.id,
                                    ).length,
                                  ),
                              )}
                              ms
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-primary">○ WHITE STATS</div>
                        {battle.white_player?.id && (
                          <div className="space-y-1 text-xs opacity-80">
                            <div>Model: {battle.white_player.model_id}</div>
                            <div>
                              Moves:{" "}
                              {
                                moves.filter(
                                  (m) =>
                                    m.player_id === battle.white_player?.id,
                                ).length
                              }
                            </div>
                            <div>
                              Avg Response:{" "}
                              {Math.round(
                                moves
                                  .filter(
                                    (m) =>
                                      m.player_id === battle.white_player?.id,
                                  )
                                  .reduce(
                                    (acc, m) => acc + (m.response_time ?? 0),
                                    0,
                                  ) /
                                  Math.max(
                                    1,
                                    moves.filter(
                                      (m) =>
                                        m.player_id === battle.white_player?.id,
                                    ).length,
                                  ),
                              )}
                              ms
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="terminal-card terminal-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono terminal-glow">
                      📈 MOVE QUALITY
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="opacity-70">Valid Moves:</span>
                        <Badge variant="secondary" className="font-mono">
                          {moves.filter((m) => m.is_valid).length}/
                          {moves.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="opacity-70">Invalid Moves:</span>
                        <Badge
                          variant={
                            moves.filter((m) => !m.is_valid).length > 0
                              ? "destructive"
                              : "secondary"
                          }
                          className="font-mono"
                        >
                          {moves.filter((m) => !m.is_valid).length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="opacity-70">Avg Confidence:</span>
                        <Badge variant="secondary" className="font-mono">
                          {Math.round(
                            moves.reduce(
                              (acc, m) => acc + (m.confidence ?? 0),
                              0,
                            ) / Math.max(1, moves.length),
                          )}
                          %
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="terminal-card terminal-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono terminal-glow">
                      🔥 TOKEN USAGE
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="opacity-70">Total In:</span>
                        <span className="text-blue-400">
                          {moves
                            .reduce((acc, m) => acc + (m.tokens_in ?? 0), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">Total Out:</span>
                        <span className="text-green-400">
                          {moves
                            .reduce((acc, m) => acc + (m.tokens_out ?? 0), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">Total Cost:</span>
                        <span className="text-primary">
                          {moves
                            .reduce(
                              (acc, m) =>
                                acc + (m.tokens_in ?? 0) + (m.tokens_out ?? 0),
                              0,
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="players" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Black Player Detailed */}
                {battle.black_player?.id && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Card className="terminal-card terminal-border cursor-pointer hover:bg-black/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-mono terminal-glow flex items-center justify-between">
                            <span>● BLACK PLAYER</span>
                            <Badge className="bg-black/50">
                              {nextPlayerColor === "black"
                                ? "ACTIVE"
                                : "WAITING"}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <PlayerCard
                        color="BLACK"
                        playerId={battle.black_player.id}
                        isActive={nextPlayerColor === "black"}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* White Player Detailed */}
                {battle.white_player?.id && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Card className="terminal-card terminal-border cursor-pointer hover:bg-black/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-mono terminal-glow flex items-center justify-between">
                            <span>○ WHITE PLAYER</span>
                            <Badge className="bg-black/50">
                              {nextPlayerColor === "white"
                                ? "ACTIVE"
                                : "WAITING"}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <PlayerCard
                        color="WHITE"
                        playerId={battle.white_player.id}
                        isActive={nextPlayerColor === "white"}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Panel - Compact Navigation Only */}
      <div className="lg:hidden border-t border-terminal-border bg-black/10 flex-shrink-0">
        <div className="p-2">
          <NavigationControls />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 border-l border-terminal-border bg-black/10 flex-col">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-2 p-0">
            {/* Battle Status - Collapsible */}
            <Collapsible
              open={battleStatusOpen}
              onOpenChange={setBattleStatusOpen}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-black/20 cursor-pointer border-b border-terminal-border/30">
                  <span className="terminal-text text-xs font-mono terminal-glow">
                    ⏱️ BATTLE STATUS
                  </span>
                  <CollapsibleIndicator isOpen={battleStatusOpen} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border-b border-terminal-border/30">
                  <BattleTimer
                    battle={{
                      ...battle,
                      game_end_reason:
                        battle.game_end_reason as GameEndReason | null,
                    }}
                    moves={moves}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Game Result - Collapsible */}
            <Collapsible open={gameResultOpen} onOpenChange={setGameResultOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-black/20 cursor-pointer border-b border-terminal-border/30">
                  <span className="terminal-text text-xs font-mono terminal-glow">
                    🏆 GAME RESULT
                  </span>
                  <CollapsibleIndicator isOpen={gameResultOpen} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-b border-terminal-border/30">
                  <GameResult
                    outcome={battle.outcome}
                    winner={battle.winner}
                    gameEndReason={
                      battle.game_end_reason as GameEndReason | null
                    }
                    whitePlayerModel={battle.white_player?.model_id}
                    blackPlayerModel={battle.black_player?.model_id}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Navigation - Collapsible */}
            <Collapsible open={navigationOpen} onOpenChange={setNavigationOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-black/20 cursor-pointer border-b border-terminal-border/30">
                  <span className="terminal-text text-xs font-mono terminal-glow">
                    🎮 NAVIGATION
                  </span>
                  <CollapsibleIndicator isOpen={navigationOpen} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border-b border-terminal-border/30">
                  <NavigationControls />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Move Info - Collapsible */}
            <Collapsible open={moveInfoOpen} onOpenChange={setMoveInfoOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-black/20 cursor-pointer border-b border-terminal-border/30">
                  <span className="terminal-text text-xs font-mono terminal-glow">
                    📋 MOVE INFO
                  </span>
                  <CollapsibleIndicator isOpen={moveInfoOpen} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border-b border-terminal-border/30">
                  <MoveInfo />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Move History - Collapsible */}
            <Collapsible
              open={moveHistoryOpen}
              onOpenChange={setMoveHistoryOpen}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-black/20 cursor-pointer border-b border-terminal-border/30">
                  <span className="terminal-text text-xs font-mono terminal-glow">
                    📚 MOVE HISTORY
                  </span>
                  <CollapsibleIndicator isOpen={moveHistoryOpen} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-b border-terminal-border/30">
                  <MoveHistory />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Battle Timeout - Always Visible at Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-terminal-border/30 bg-black/20">
          <BattleTimeout />
        </div>
      </div>
    </div>
  );
}
