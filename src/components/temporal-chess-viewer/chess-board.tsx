"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { Chess } from "chess.js";
import { useParams } from "next/navigation";
import * as React from "react";
import { Chessboard, defaultPieces } from "react-chessboard";
import { Card } from "@/components/ui/card";
import { BattlesCollection, PlayersCollection } from "@/db/electric";
import { useCurrentMove } from "@/hooks/use-current-move";

export function ChessBoard() {
  const { battle_id } = useParams<{ battle_id: string }>();
  const {
    data: [battle],
  } = useLiveQuery((q) =>
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

  // Create game over info from battle properties
  const gameOverInfo = React.useMemo(() => {
    if (!battle?.outcome) {
      return { over: false };
    }

    return {
      over: true,
      winner:
        battle.winner === "white"
          ? "White"
          : battle.winner === "black"
            ? "Black"
            : undefined,
      draw: battle.outcome === "draw",
    };
  }, [battle?.outcome, battle?.winner]);

  const currentMove = useCurrentMove();

  const position = React.useMemo(() => {
    if (!currentMove) {
      return new Chess().fen();
    }
    return currentMove.state;
  }, [currentMove]);

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
    <Card className="terminal-card terminal-border p-4">
      <div className="w-full max-w-md relative">
        <Chessboard
          key={position}
          options={{
            position,
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
              boxShadow: "0 0 15px rgba(8, 255, 8, 0.2)",
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
        {gameOverInfo?.over && (
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
                    ? battle?.white_player?.model_id
                    : battle?.black_player?.model_id}
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
  );
}
