"use client";

import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useMoveIndex } from "@/hooks/use-move-index";
import { useMoves } from "@/hooks/use-moves";

export function MoveHistory() {
  const { battle_id } = useParams<{ battle_id: string }>();
  const { data: moves } = useMoves(battle_id);
  const { moveIndex, setMoveIndex } = useMoveIndex();

  return (
    <Card className="terminal-card terminal-border">
      <CardHeader>
        <CardTitle className="terminal-text text-sm">MOVE_LOG</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMoveIndex(0)}
            className={`w-full text-left p-2 rounded terminal-border transition-colors ${
              moveIndex === 0
                ? "terminal-button"
                : "hover:bg-secondary/20 terminal-text"
            }`}
          >
            START
          </button>
          {moves.map((move, index) => (
            <button
              key={move.id}
              type="button"
              onClick={() => setMoveIndex(index + 1)}
              className={`w-full text-left p-2 rounded terminal-border transition-colors ${
                moveIndex === index + 1
                  ? "terminal-button"
                  : "hover:bg-secondary/20 terminal-text"
              }`}
            >
              <span className="opacity-70">{index + 1}.</span>
              <span className="ml-2">{move.move}</span>
              {move.player?.model_id && (
                <span className="ml-2 opacity-60">
                  [{move.player.model_id}]
                </span>
              )}
              {typeof move.confidence === "number" && (
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
  );
}
