"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { Chessboard, defaultPieces } from "react-chessboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import type * as schema from "@/db/schema";
import { movesByBattleCollection, battleByIdCollection, playerByIdCollection } from "@/lib/collections";
import { buildMovesWithPlayersQuery, type MoveWithPlayer } from "@/lib/queries";

interface TemporalChessViewerProps {
  battleId: string;
}

export default function TemporalChessViewer({
  battleId,
}: TemporalChessViewerProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const [hasPlayedVictory, setHasPlayedVictory] = useState(false);
  const [gameOverInfo, setGameOverInfo] = useState<{ over: boolean; winner?: "White" | "Black"; draw?: boolean }>({ over: false });
  // Minimal extension so we can add a synthetic START entry
  type TimelineMove = Pick<schema.MoveSelect, "id" | "state" | "is_valid" | "move" | "tokens_in" | "tokens_out" | "confidence" | "reasoning"> & {
    isSynthetic?: boolean;
    player_model_id?: string | null;
  };
  const [moves, setMoves] = useState<TimelineMove[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [battle, setBattle] = useState<schema.BattleSelect | null>(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const moveLogRef = useRef<HTMLDivElement | null>(null);

  const { data: battleData, isLoading: battleLoading } = useLiveQuery(
    (q) => q.from({ battle: battleByIdCollection(battleId) }),
    [battleId],
  );

  const whiteId = battleData?.[0]?.white_player_id;
  const blackId = battleData?.[0]?.black_player_id;

  const { data: movesData, isLoading: movesLoading } = useLiveQuery(
    (q) => q.from({ move: movesByBattleCollection(battleId) }),
    [battleId],
  );

  const movesWithPlayers = useLiveQuery(buildMovesWithPlayersQuery(battleId), [battleId]);
  const movesWithPlayersData = movesWithPlayers?.data as MoveWithPlayer[] | undefined;

  const { data: whitePlayerData } = useLiveQuery(
    (q) => q.from({ player: playerByIdCollection(whiteId ?? "__none__") }),
    [whiteId],
  );

  const { data: blackPlayerData } = useLiveQuery(
    (q) => q.from({ player: playerByIdCollection(blackId ?? "__none__") }),
    [blackId],
  );

  useEffect(() => {
    // Always include a zero-state START entry before any moves
    const joinedOrBase: TimelineMove[] | undefined =
      (movesWithPlayersData as unknown as TimelineMove[] | undefined) ??
      (movesData as unknown as TimelineMove[] | undefined);
    if (joinedOrBase) {
      const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const startEntry: TimelineMove = {
        id: "START",
        move: "START",
        state: INITIAL_FEN,
        is_valid: true,
        tokens_in: null,
        tokens_out: null,
        confidence: null as unknown as number,
        reasoning: null as unknown as string,
        isSynthetic: true,
      };
      const augmented: TimelineMove[] = [startEntry, ...joinedOrBase];
      setMoves(augmented);

      if (!initialized) {
        setInitialized(true);
        setCurrentMoveIndex(autoFollow ? augmented.length - 1 : 0);
      } else {
        setCurrentMoveIndex((prev) =>
          autoFollow ? augmented.length - 1 : Math.min(prev, augmented.length - 1),
        );
      }
    }
  }, [movesData, movesWithPlayersData, initialized, autoFollow]);

  // Auto-scroll move log to bottom when following latest
  useEffect(() => {
    const atEnd = currentMoveIndex === Math.max(0, moves.length - 1);
    if (autoFollow || atEnd) {
      const el = moveLogRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }
  }, [moves, currentMoveIndex, autoFollow]);

  useEffect(() => {
    if (battleData && battleData.length > 0) {
      setBattle(battleData[0]);
    }
  }, [battleData]);

  const goToPreviousMove = useCallback(() => {
    setAutoFollow(false);
    setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1));
  }, [currentMoveIndex]);

  const goToNextMove = useCallback(() => {
    const nextIndex = Math.min(moves.length - 1, currentMoveIndex + 1);
    setCurrentMoveIndex(nextIndex);
    setAutoFollow(nextIndex === moves.length - 1);
  }, [currentMoveIndex, moves.length]);

  const goToStart = useCallback(() => {
    setAutoFollow(false);
    setCurrentMoveIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentMoveIndex(moves.length - 1);
    setAutoFollow(true);
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

  const ensureAudio = useCallback(async () => {
    if (typeof window === "undefined") return null;
    // @ts-expect-error - webkit prefix for Safari
    const AC: typeof AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtxRef.current && AC) {
      const ctx = new AC();
      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "running") {
      try {
        await audioCtxRef.current.resume();
      } catch {}
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback(
    (freq = 560, durationMs = 80, volume = 0.12) => {
      if (!soundEnabled) return;
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master) return;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
      osc.connect(env);
      env.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
    },
    [soundEnabled]
  );

  const playVictory = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const notes = [523.25, 659.25, 783.99]; // C5-E5-G5
    const startAt = ctx.currentTime;
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t0 = startAt + index * 0.12;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(0.12, t0 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(env);
      env.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }, [soundEnabled]);

  // Hooks below must remain before any early returns to preserve hook order
  // Play a short beep for valid moves when index changes forward/back
  const prevIndexRef = useRef(0);
  useEffect(() => {
    if (currentMoveIndex !== prevIndexRef.current) {
      const move = moves[currentMoveIndex];
      if (move && move.id !== "START" && move.is_valid) {
        void ensureAudio()?.then(() => {
          const sideIsWhite = currentMoveIndex === 0 ? true : currentMoveIndex % 2 === 1;
          playBeep(sideIsWhite ? 600 : 520, 70, 0.14);
        });
      }
      prevIndexRef.current = currentMoveIndex;
    }
  }, [currentMoveIndex, moves, ensureAudio, playBeep]);

  // Detect game over from final FEN
  useEffect(() => {
    if (!moves.length) return;
    const last = moves[moves.length - 1];
    if (!last || last.id === "START") return;
    try {
      const chess = new Chess(last.state);
      if (chess.isGameOver()) {
        let winner: "White" | "Black" | undefined;
        let draw = false;
        if (chess.isCheckmate()) {
          winner = chess.turn() === "w" ? "Black" : "White";
        } else {
          draw = true;
        }
        setGameOverInfo({ over: true, winner, draw });
      } else {
        setGameOverInfo({ over: false });
        setHasPlayedVictory(false);
      }
    } catch {
      // Ignore parse errors
    }
  }, [moves]);

  // Play a short victory tone once
  useEffect(() => {
    if (gameOverInfo.over && !hasPlayedVictory) {
      void ensureAudio()?.then(() => {
        playVictory();
        setHasPlayedVictory(true);
      });
    }
  }, [gameOverInfo.over, hasPlayedVictory, ensureAudio, playVictory]);

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
  const isStart = currentMove?.id === "START" || currentMove?.isSynthetic === true;
  const moveNumber = isStart
    ? 0
    : Math.floor((currentMoveIndex - 1) / 2) + 1;
  // With a START entry at index 0, white moves at indices 1,3,5,...
  const isWhiteMove = currentMoveIndex === 0 ? true : currentMoveIndex % 2 === 1;
  const playerColor = isWhiteMove ? "White" : "Black";
  const progressPercentage =
    moves.length > 1 ? (currentMoveIndex / (moves.length - 1)) * 100 : 0;

  

  // Terminal-themed custom pieces: add green glow/border to black pieces
  const terminalPieces = {
    ...defaultPieces,
    bP: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bP({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bR: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bR({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bN: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bN({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bB: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bB({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bQ: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bQ({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bK: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bK({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
  };

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
          <PlayerCard
            color="WHITE"
            modelId={whitePlayerData?.[0]?.model_id}
            isActive={isWhiteMove}
          />
          <PlayerCard
            color="BLACK"
            modelId={blackPlayerData?.[0]?.model_id}
            isActive={!isWhiteMove}
          />
        </div>

        {/* Main Chess Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2 flex justify-center">
            <Card className="terminal-card terminal-border p-4">
              <div className="w-full max-w-md relative">
                <Chessboard
                  key={currentMove.id}
                  options={{
                    position: currentMove.state,
                    allowDragging: false,
                    showNotation: true,
                    id: "terminal-board",
                    pieces: terminalPieces,
                    boardStyle: {
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 0 15px rgba(8, 255, 8, 0.2)",
                    },
                    lightSquareStyle: {
                      background: "var(--card)",
                      boxShadow: "0 0 15px rgba(8, 255, 8, 0.2)"
                    },
                    darkSquareStyle: {
                      background: "var(--secondary)",
                      boxShadow: "0 0 15px rgba(8, 255, 8, 0.2)",

                    },
                    dropSquareStyle: {
                      background: "rgba(1, 255, 0, 0.08)",
                      boxShadow: "inset 0 0 0 2px var(--ring)",
                      
                    },
                    darkSquareNotationStyle: {
                      color: "var(--foreground)",
                      textShadow: "0 0 5px var(--foreground)",
                      fontFamily: "'Courier New', monospace",
                      opacity: 0.9,
                    },
                    lightSquareNotationStyle: {
                      color: "var(--foreground)",
                      textShadow: "0 0 5px var(--foreground)",
                      fontFamily: "'Courier New', monospace",
                      opacity: 0.9,
                    },
                    alphaNotationStyle: {
                      color: "var(--foreground)",
                      textShadow: "0 0 5px var(--foreground)",
                      fontFamily: "'Courier New', monospace",
                      opacity: 0.8,
                    },
                    numericNotationStyle: {
                      color: "var(--foreground)",
                      textShadow: "0 0 5px var(--foreground)",
                      fontFamily: "'Courier New', monospace",
                      opacity: 0.7,
                    },
                  }}
                />
                {gameOverInfo.over && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/70">
                    <div className="text-center">
                      <div className="terminal-text terminal-glow text-2xl md:text-3xl font-mono animate-pulse">
                        {gameOverInfo.draw
                          ? "DRAW"
                          : `${(gameOverInfo.winner ?? "").toUpperCase()} WINS`}
                      </div>
                      {!gameOverInfo.draw && (
                        <div className="terminal-text text-xs md:text-sm opacity-80 mt-1">
                          {gameOverInfo.winner === "White"
                            ? whitePlayerData?.[0]?.model_id
                            : blackPlayerData?.[0]?.model_id}
                        </div>
                      )}
                      <div className="terminal-text text-[10px] md:text-xs opacity-60 mt-2">
                        Review with PREV/NEXT
                      </div>
                    </div>
                  </div>
                )}
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
                    {isStart
                      ? "START"
                      : `MOVE_${moveNumber.toString().padStart(2, "0")}`}
                  </div>
                  <div className="terminal-text text-sm opacity-80">
                    {playerColor}_PLAYER
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="terminal-text opacity-70">COMMAND:</span>
                    <Badge
                      variant={isStart ? "secondary" : currentMove.is_valid ? "default" : "destructive"}
                      className="terminal-text"
                    >
                      {isStart ? "—" : currentMove.move}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="terminal-text opacity-70">STATUS:</span>
                    <span
                      className={`terminal-text ${
                        isStart
                          ? "text-foreground"
                          : currentMove.is_valid
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {isStart ? "READY" : currentMove.is_valid ? "VALID" : "INVALID"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="terminal-text opacity-70">POSITION:</span>
                    <span className="terminal-text">
                      {currentMoveIndex}/{Math.max(0, moves.length - 1)}
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
                  {typeof currentMove.confidence === "number" && (
                    <div className="flex justify-between">
                      <span className="terminal-text opacity-70">CONFIDENCE:</span>
                      <span className="terminal-text">
                        {currentMove.confidence}%
                      </span>
                    </div>
                  )}
                  {currentMove.reasoning && (
                    <div className="mt-2 p-2 rounded border border-dashed border-[var(--border)] bg-[var(--card)]/50">
                      <div className="terminal-text text-[10px] opacity-70 mb-1">RATIONALE</div>
                      <div className="terminal-text text-xs opacity-80 line-clamp-3">
                        {currentMove.reasoning}
                      </div>
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
                    <span>POS: {String(currentMoveIndex).padStart(3, "0")}</span>
                    <span>END: {String(Math.max(0, moves.length - 1)).padStart(3, "0")}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="terminal-text opacity-70">FOLLOW LATEST</span>
                    <Button
                      type="button"
                      onClick={() => setAutoFollow((v) => !v)}
                      variant={autoFollow ? "default" : "outline"}
                      className="terminal-button terminal-text px-3 py-1"
                    >
                      {autoFollow ? "ON" : "OFF"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="terminal-text opacity-70">SOUND</span>
                    <Button
                      type="button"
                      onClick={async () => {
                        await ensureAudio();
                        setSoundEnabled((v) => !v);
                      }}
                      variant={soundEnabled ? "default" : "outline"}
                      className="terminal-button terminal-text px-3 py-1"
                    >
                      {soundEnabled ? "ON" : "OFF"}
                    </Button>
                  </div>
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
                <div ref={moveLogRef} className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
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
                      {index === 0 ? (
                        <span className="opacity-70">START</span>
                      ) : (
                        <span className="opacity-70">
                          {Math.floor((index - 1) / 2) + 1}
                          {(index - 1) % 2 === 0 ? "." : "..."}
                        </span>
                      )}
                      <span className="ml-2">{index === 0 ? "—" : move.move}</span>
                      {index !== 0 && move.player_model_id && (
                        <span className="ml-2 opacity-60">[{move.player_model_id}]</span>
                      )}
                      {index !== 0 && typeof move.confidence === "number" && (
                        <span className="ml-2 opacity-50">{move.confidence}%</span>
                      )}
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
