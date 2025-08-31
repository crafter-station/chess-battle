"use client";

import { Chess } from "chess.js";
import { useParams } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useCurrentMove } from "@/hooks/use-current-move";
import { useMoveIndex } from "@/hooks/use-move-index";
import { useMoves } from "@/hooks/use-moves";

export function MoveInfo() {
  const { battle_id } = useParams<{ battle_id: string }>();
  const { moveIndex } = useMoveIndex();
  const currentMove = useCurrentMove();

  const { data: moves } = useMoves(battle_id);

  const playerColor = React.useMemo(() => {
    if (!currentMove) {
      return "white";
    }

    if (!currentMove.is_valid) {
      return new Chess(currentMove.state).turn() === "w" ? "white" : "black";
    }

    return new Chess(currentMove.state).turn() === "w" ? "black" : "white";
  }, [currentMove]);

  if (!currentMove) {
    return (
      <Card className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text text-sm">LAST_MOVE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="terminal-text text-xl terminal-glow">START</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-card terminal-border">
      <CardHeader>
        <CardTitle className="terminal-text text-sm">LAST_MOVE</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="terminal-text text-xl terminal-glow">
            {moveIndex === 0
              ? "START"
              : `MOVE_${moveIndex.toString().padStart(2, "0")}`}
          </div>
          <div className="terminal-text text-sm opacity-80">
            {playerColor === "black" ? "BLACK_PLAYER" : "WHITE_PLAYER"}
          </div>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="terminal-text opacity-70">COMMAND:</span>
            <Badge
              variant={
                moveIndex === 0
                  ? "secondary"
                  : currentMove?.is_valid
                    ? "default"
                    : "destructive"
              }
              className="terminal-text !text-primary-foreground"
            >
              {moveIndex === -1 ? "—" : currentMove?.move}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="terminal-text opacity-70">STATUS:</span>
            <span
              className={`terminal-text ${
                moveIndex === -1
                  ? "text-foreground"
                  : currentMove?.is_valid
                    ? "text-green-400"
                    : "text-red-400"
              }`}
            >
              {moveIndex === -1
                ? "READY"
                : currentMove?.is_valid
                  ? "VALID"
                  : "INVALID"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="terminal-text opacity-70">POSITION:</span>
            <span className="terminal-text">
              {moveIndex}/{Math.max(0, moves.length - 1)}
            </span>
          </div>
          {currentMove?.tokens_in && (
            <div className="flex justify-between">
              <span className="terminal-text opacity-70">TOKENS_IN:</span>
              <span className="terminal-text">{currentMove?.tokens_in}</span>
            </div>
          )}
          {currentMove?.tokens_out && (
            <div className="flex justify-between">
              <span className="terminal-text opacity-70">TOKENS_OUT:</span>
              <span className="terminal-text">{currentMove.tokens_out}</span>
            </div>
          )}
          {typeof currentMove?.confidence === "number" && (
            <div className="flex justify-between">
              <span className="terminal-text opacity-70">CONFIDENCE:</span>
              <span className="terminal-text">{currentMove.confidence}%</span>
            </div>
          )}
          {currentMove?.response_time && (
            <div className="flex justify-between">
              <span className="terminal-text opacity-70">RESPONSE_TIME:</span>
              <span className="terminal-text">
                {currentMove.response_time}ms
              </span>
            </div>
          )}

          {currentMove?.reasoning && (
            <div className="mt-2 p-2 rounded border border-dashed border-[var(--border)] bg-[var(--card)]/50">
              <div className="terminal-text text-[10px] opacity-70 mb-1">
                RATIONALE
              </div>
              <div className="terminal-text text-xs opacity-80 line-clamp-3">
                {currentMove?.reasoning}
              </div>
            </div>
          )}

          {currentMove?.raw_response && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="mt-2 w-full p-2 rounded border border-dashed border-[var(--border)] bg-[var(--card)]/50 hover:bg-[var(--card)]/70 transition-colors text-left"
                >
                  <div className="terminal-text text-[10px] opacity-70 mb-1">
                    RAW_RESPONSE
                  </div>
                  <div className="terminal-text text-xs opacity-80 truncate">
                    {currentMove.raw_response.substring(0, 100)}
                    {currentMove.raw_response.length > 100 ? "..." : ""}
                  </div>
                  <div className="terminal-text text-[10px] opacity-50 mt-1">
                    Click to view full response
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="terminal-text">
                    RAW_RESPONSE
                  </DialogTitle>
                </DialogHeader>
                <pre className="terminal-text text-sm whitespace-pre-wrap break-words bg-[var(--card)]/50 p-4 rounded border">
                  {currentMove.raw_response}
                </pre>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
