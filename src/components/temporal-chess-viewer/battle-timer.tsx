"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BattleTimerProps {
  battle: {
    created_at: string;
    winner?: "white" | "black" | null;
    outcome?: "win" | "draw" | null;
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
    if (battle.outcome === "draw") {
      return { text: "DRAW", color: "text-yellow-400" };
    }
    if (battle.winner === "white") {
      return { text: "WHITE_WINS", color: "text-green-400" };
    }
    if (battle.winner === "black") {
      return { text: "BLACK_WINS", color: "text-green-400" };
    }
    return { text: "IN_PROGRESS", color: "text-blue-400" };
  };

  const status = getTimerStatus();

  return (
    <Card className="terminal-card terminal-border">
      <CardHeader>
        <CardTitle className="terminal-text text-sm">BATTLE_TIMER</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="terminal-text text-2xl terminal-glow font-mono">
            {formatDuration(elapsedSeconds)}
          </div>
          <div className={`terminal-text text-sm ${status.color}`}>
            {status.text}
          </div>
        </div>

        <div className="space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="terminal-text opacity-70">STARTED:</span>
            <span className="terminal-text">
              {new Date(startTime).toLocaleTimeString()}
            </span>
          </div>
          {isGameEnded && endTime && (
            <div className="flex justify-between">
              <span className="terminal-text opacity-70">ENDED:</span>
              <span className="terminal-text">
                {new Date(endTime).toLocaleTimeString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="terminal-text opacity-70">MOVES:</span>
            <span className="terminal-text">{moves.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
