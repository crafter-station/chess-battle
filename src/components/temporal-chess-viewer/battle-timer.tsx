"use client";

import * as React from "react";

import type { GameEndReason } from "@/lib/game-end-reason";

interface BattleTimerProps {
  battle: {
    created_at: string;
    winner?: "white" | "black" | null;
    outcome?: "win" | "draw" | null;
    game_end_reason?: GameEndReason | null;
  };
  moves: Array<{
    created_at: string;
  }>;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export function BattleTimer({ battle, moves }: BattleTimerProps) {
  const [currentTime, setCurrentTime] = React.useState(Date.now());

  const isGameEnded = battle.winner !== null || battle.outcome !== null;

  const startTime = new Date(`${battle.created_at}Z`).getTime();

  // For ended games, use the timestamp of the last move as the end time
  const endTime = React.useMemo(() => {
    if (!isGameEnded || moves.length === 0) return null;
    const lastMove = moves[moves.length - 1];
    return new Date(`${lastMove.created_at}Z`).getTime();
  }, [isGameEnded, moves]);

  // Update current time every second for ongoing games
  React.useEffect(() => {
    if (isGameEnded) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameEnded]);

  const elapsedSeconds = React.useMemo(() => {
    if (isGameEnded && endTime) {
      return Math.floor((endTime - startTime) / 1000);
    }
    return Math.floor((currentTime - startTime) / 1000);
  }, [isGameEnded, endTime, currentTime, startTime]);

  const getTimerStatus = () => {
    if (!battle.outcome) {
      return { text: "IN_PROGRESS", color: "text-blue-400", description: null };
    }

    const reason = battle.game_end_reason;

    if (battle.outcome === "draw") {
      const drawReasons: Record<GameEndReason, string> = {
        stalemate: "by Stalemate",
        insufficient_material: "by Insufficient Material",
        threefold_repetition: "by Threefold Repetition",
        timeout: "by Timeout",
        agreement: "by Agreement",
        draw: "by Agreement",
        checkmate: "", // shouldn't happen for draws
        resignation: "", // shouldn't happen for draws
        forfeit_invalid_moves: "", // shouldn't happen for draws
        forfeit_insufficient_credits: "", // shouldn't happen for draws
      };

      const description = reason ? drawReasons[reason] || "" : "";
      return {
        text: "DRAW",
        color: "text-yellow-400",
        description: description || null,
      };
    }

    if (battle.winner) {
      const winReasons: Record<GameEndReason, string> = {
        checkmate: "by Checkmate",
        resignation: "by Resignation",
        forfeit_invalid_moves: "by Forfeit",
        timeout: "by Timeout",
        stalemate: "by Tiebreaker", // draw with tiebreaker
        insufficient_material: "by Tiebreaker",
        threefold_repetition: "by Tiebreaker",
        agreement: "by Tiebreaker",
        draw: "by Tiebreaker",
        forfeit_insufficient_credits: "", // shouldn't happen for draws
      };

      const winnerText =
        battle.winner === "white" ? "WHITE_WINS" : "BLACK_WINS";
      const description = reason ? winReasons[reason] || "" : "";

      return {
        text: winnerText,
        color: "text-green-400",
        description: description || null,
      };
    }

    return { text: "COMPLETED", color: "text-gray-400", description: null };
  };

  const status = getTimerStatus();

  return (
    <div className="space-y-3">
      <div className="terminal-text text-xs terminal-glow font-mono opacity-70">
        BATTLE_TIMER
      </div>

      <div className="text-center">
        <div className="terminal-text text-3xl terminal-glow font-mono">
          {formatDuration(elapsedSeconds)}
        </div>
        <div className={`terminal-text text-sm font-mono ${status.color}`}>
          {status.text}
        </div>
        {status.description && (
          <div className="terminal-text text-xs opacity-70 mt-1">
            {status.description}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <div className="terminal-border rounded p-2 bg-black/20">
          <div className="terminal-text opacity-70">STARTED:</div>
          <div className="terminal-text">
            {new Date(startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div className="terminal-border rounded p-2 bg-black/20">
          <div className="terminal-text opacity-70">MOVES:</div>
          <div className="terminal-text">{moves.length}</div>
        </div>
      </div>
    </div>
  );
}
