"use client";

import { useState, useEffect, useCallback } from "react";
import { useShape } from "@electric-sql/react";
import { Chessboard } from "react-chessboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type * as schema from "@/db/schema";

interface TemporalChessViewerProps {
  battleId: string;
}

export default function TemporalChessViewer({
  battleId,
}: TemporalChessViewerProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState<schema.MoveSelect[]>([]);
  const [battle, setBattle] = useState<schema.BattleSelect | null>(null);

  const { isLoading: movesLoading, data: movesData } =
    useShape<schema.MoveSelect>({
      url: `${process.env.NEXT_PUBLIC_URL}/api/shapes/battles/${battleId}/moves`,
    });

  const { isLoading: battleLoading, data: battleData } =
    useShape<schema.BattleSelect>({
      url: `${process.env.NEXT_PUBLIC_URL}/api/shapes/battles/${battleId}`,
    });

  const { data: whitePlayerData } = useShape<schema.PlayerSelect>({
    url: `${process.env.NEXT_PUBLIC_URL}/api/shapes/players/${battleData?.[0]?.white_player_id}`,
  });

  const { data: blackPlayerData } = useShape<schema.PlayerSelect>({
    url: `${process.env.NEXT_PUBLIC_URL}/api/shapes/players/${battleData?.[0]?.black_player_id}`,
  });

  useEffect(() => {
    if (movesData && movesData.length > 0) {
      setMoves(movesData);
      // Start with the last move (current position)
      setCurrentMoveIndex(movesData.length - 1);
    }
  }, [movesData]);

  useEffect(() => {
    if (battleData && battleData.length > 0) {
      setBattle(battleData[0]);
    }
  }, [battleData]);

  const goToPreviousMove = useCallback(() => {
    setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1));
  }, [currentMoveIndex]);

  const goToNextMove = useCallback(() => {
    setCurrentMoveIndex(Math.min(moves.length - 1, currentMoveIndex + 1));
  }, [currentMoveIndex, moves.length]);

  const goToStart = useCallback(() => {
    setCurrentMoveIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentMoveIndex(moves.length - 1);
  }, [moves.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPreviousMove();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNextMove();
          break;
        case "ArrowUp":
          event.preventDefault();
          goToStart();
          break;
        case "ArrowDown":
          event.preventDefault();
          goToEnd();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPreviousMove, goToNextMove, goToStart, goToEnd]);

  const isLoading = movesLoading || battleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 terminal-card rounded-lg">
        <div className="terminal-text text-lg terminal-glow">
          Loading battle data...
        </div>
      </div>
    );
  }

  if (!moves.length || !battle) {
    return (
      <div className="flex items-center justify-center h-96 terminal-card rounded-lg">
        <div className="terminal-text text-lg text-muted-foreground">
          No battle data found
        </div>
      </div>
    );
  }

  const currentMove = moves[currentMoveIndex];
  const moveNumber = Math.floor(currentMoveIndex / 2) + 1;
  const isWhiteMove = currentMoveIndex % 2 === 0;
  const playerColor = isWhiteMove ? "White" : "Black";
  const progressPercentage = ((currentMoveIndex + 1) / moves.length) * 100;

  return (
    <div className="min-h-screen p-6 terminal-card crt-flicker">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Terminal Header */}
        <Card className="terminal-card terminal-border">
          <CardHeader className="text-center">
            <CardTitle className="terminal-text terminal-glow text-2xl">
              CHESS_BATTLE_VIEWER.exe
            </CardTitle>
            <div className="terminal-text text-sm opacity-80">
              {`BATTLE_ID: ${battleId.slice(0, 8)}...`}
            </div>
          </CardHeader>
        </Card>

        {/* Player Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="terminal-card terminal-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={currentMoveIndex % 2 === 0 ? "default" : "secondary"}
                  className="terminal-text"
                >
                  WHITE
                </Badge>
                <span className="terminal-text font-mono text-sm">
                  {whitePlayerData?.[0]?.model_id}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card terminal-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={currentMoveIndex % 2 === 1 ? "default" : "secondary"}
                  className="terminal-text"
                >
                  BLACK
                </Badge>
                <span className="terminal-text font-mono text-sm">
                  {blackPlayerData?.[0]?.model_id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chess Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2 flex justify-center">
            <Card className="terminal-card terminal-border p-4">
              <div className="w-full max-w-md">
                <Chessboard
                  key={currentMove.id}
                  options={{
                    position: currentMove.state,
                    allowDragging: false,
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Current Move Info */}
            <Card className="terminal-card terminal-border">
              <CardHeader>
                <CardTitle className="terminal-text text-sm">
                  CURRENT_MOVE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="terminal-text text-xl terminal-glow">
                    MOVE_{moveNumber.toString().padStart(2, "0")}
                  </div>
                  <div className="terminal-text text-sm opacity-80">
                    {playerColor}_PLAYER
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="terminal-text opacity-70">COMMAND:</span>
                    <Badge
                      variant={currentMove.is_valid ? "default" : "destructive"}
                      className="terminal-text"
                    >
                      {currentMove.move}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="terminal-text opacity-70">STATUS:</span>
                    <span
                      className={`terminal-text ${
                        currentMove.is_valid ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {currentMove.is_valid ? "VALID" : "INVALID"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="terminal-text opacity-70">POSITION:</span>
                    <span className="terminal-text">
                      {currentMoveIndex + 1}/{moves.length}
                    </span>
                  </div>
                  {currentMove.tokens_in && (
                    <div className="flex justify-between">
                      <span className="terminal-text opacity-70">
                        TOKENS_IN:
                      </span>
                      <span className="terminal-text">
                        {currentMove.tokens_in}
                      </span>
                    </div>
                  )}
                  {currentMove.tokens_out && (
                    <div className="flex justify-between">
                      <span className="terminal-text opacity-70">
                        TOKENS_OUT:
                      </span>
                      <span className="terminal-text">
                        {currentMove.tokens_out}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <Card className="terminal-card terminal-border">
              <CardHeader>
                <CardTitle className="terminal-text text-sm">
                  NAVIGATION
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={goToStart}
                    disabled={currentMoveIndex === 0}
                    variant="outline"
                    className="terminal-button terminal-text"
                  >
                    ⬆️ START
                  </Button>
                  <Button
                    onClick={goToPreviousMove}
                    disabled={currentMoveIndex === 0}
                    variant="outline"
                    className="terminal-button terminal-text"
                  >
                    ⬅️ PREV
                  </Button>
                  <Button
                    onClick={goToNextMove}
                    disabled={currentMoveIndex === moves.length - 1}
                    variant="outline"
                    className="terminal-button terminal-text"
                  >
                    NEXT ➡️
                  </Button>
                  <Button
                    onClick={goToEnd}
                    disabled={currentMoveIndex === moves.length - 1}
                    variant="outline"
                    className="terminal-button terminal-text"
                  >
                    END ⬇️
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs terminal-text opacity-70">
                    <span>POS: 001</span>
                    <span>END: {moves.length.toString().padStart(3, "0")}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="terminal-text text-xs opacity-60 text-center">
                  Use arrow keys for navigation
                </div>
              </CardContent>
            </Card>

            {/* Move History */}
            <Card className="terminal-card terminal-border">
              <CardHeader>
                <CardTitle className="terminal-text text-sm">
                  MOVE_LOG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
                  {moves.map((move, index) => (
                    <button
                      key={move.id}
                      type="button"
                      onClick={() => setCurrentMoveIndex(index)}
                      className={`w-full text-left p-2 rounded terminal-border transition-colors ${
                        index === currentMoveIndex
                          ? "terminal-button"
                          : "hover:bg-secondary/20 terminal-text"
                      }`}
                    >
                      <span className="opacity-70">
                        {Math.floor(index / 2) + 1}
                        {index % 2 === 0 ? "." : "..."}
                      </span>
                      <span className="ml-2">{move.move}</span>
                      {!move.is_valid && (
                        <span className="ml-2 text-red-400">[ERR]</span>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
