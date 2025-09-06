"use client";

import { useParams } from "next/navigation";
import * as React from "react";

import { Chess } from "chess.js";

import { Badge } from "@/components/ui/badge";
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
      <div className="space-y-2">
        <div className="terminal-text text-xs terminal-glow font-mono opacity-70">
          LAST_MOVE
        </div>
        <div className="text-center">
          <div className="terminal-text text-xl terminal-glow font-mono">
            START
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="terminal-text text-xs terminal-glow font-mono opacity-70">
        LAST_MOVE
      </div>

      <div className="text-center mb-3">
        <div className="terminal-text text-lg terminal-glow font-mono">
          {moveIndex === 0
            ? "START"
            : `MOVE ${moveIndex.toString().padStart(2, "0")}`}
        </div>
        <div className="terminal-text text-xs opacity-80">
          {playerColor === "black" ? "● BLACK" : "○ WHITE"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <div className="terminal-border rounded p-2 bg-black/20">
          <div className="terminal-text opacity-70">COMMAND:</div>
          <Badge
            variant={
              moveIndex === 0
                ? "secondary"
                : currentMove?.is_valid
                  ? "default"
                  : "destructive"
            }
            className="text-xs font-mono mt-1"
          >
            {moveIndex === -1 ? "—" : currentMove?.move}
          </Badge>
        </div>
        <div className="terminal-border rounded p-2 bg-black/20">
          <div className="terminal-text opacity-70">STATUS:</div>
          <div
            className={`terminal-text font-mono mt-1 ${
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
          </div>
        </div>
        <div className="terminal-border rounded p-2 bg-black/20">
          <div className="terminal-text opacity-70">POSITION:</div>
          <div className="terminal-text font-mono mt-1">
            {moveIndex}/{Math.max(0, moves.length - 1)}
          </div>
        </div>
        {currentMove?.tokens_in && (
          <div className="terminal-border rounded p-2 bg-black/20">
            <div className="terminal-text opacity-70">TOKENS_IN:</div>
            <div className="terminal-text font-mono mt-1">
              {currentMove.tokens_in}
            </div>
          </div>
        )}
        {currentMove?.tokens_out && (
          <div className="terminal-border rounded p-2 bg-black/20">
            <div className="terminal-text opacity-70">TOKENS_OUT:</div>
            <div className="terminal-text font-mono mt-1">
              {currentMove.tokens_out}
            </div>
          </div>
        )}
        {typeof currentMove?.confidence === "number" && (
          <div className="terminal-border rounded p-2 bg-black/20">
            <div className="terminal-text opacity-70">CONFIDENCE:</div>
            <div className="terminal-text font-mono mt-1">
              {currentMove.confidence}%
            </div>
          </div>
        )}
        {currentMove?.response_time && (
          <div className="terminal-border rounded p-2 bg-black/20">
            <div className="terminal-text opacity-70">RESPONSE_TIME:</div>
            <div className="terminal-text font-mono mt-1">
              {currentMove.response_time}ms
            </div>
          </div>
        )}
      </div>

      {currentMove?.reasoning && (
        <div className="terminal-border rounded p-2 bg-black/20">
          <div className="terminal-text text-[10px] opacity-70 mb-1 font-mono">
            RATIONALE
          </div>
          <div className="terminal-text text-xs opacity-80 line-clamp-3">
            {currentMove.reasoning}
          </div>
        </div>
      )}

      {currentMove?.raw_response && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full terminal-border rounded p-2 bg-black/20 hover:bg-black/30 transition-colors text-left"
            >
              <div className="terminal-text text-[10px] opacity-70 mb-1 font-mono">
                RAW_RESPONSE
              </div>
              <div className="terminal-text text-xs opacity-80 truncate">
                {currentMove.raw_response.substring(0, 50)}
                {currentMove.raw_response.length > 50 ? "..." : ""}
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="terminal-text">RAW_RESPONSE</DialogTitle>
            </DialogHeader>
            <pre className="terminal-text text-sm whitespace-pre-wrap break-words bg-[var(--card)]/50 p-4 rounded border">
              {currentMove.raw_response}
            </pre>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
