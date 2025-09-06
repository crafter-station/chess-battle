"use client";

import { useParams } from "next/navigation";

import { useMoveIndex } from "@/hooks/use-move-index";
import { useMoves } from "@/hooks/use-moves";

export function MoveHistory() {
  const { battle_id } = useParams<{ battle_id: string }>();
  const { data: moves } = useMoves(battle_id);
  const { moveIndex, setMoveIndex } = useMoveIndex();

  return (
    <div className="h-full flex flex-col">
      <div className="terminal-text text-xs terminal-glow font-mono opacity-70 p-4 pb-2 border-b border-terminal-border/30">
        MOVE_LOG
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMoveIndex(0)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
              moveIndex === 0
                ? "bg-primary/20 border border-primary/30 text-primary"
                : "hover:bg-black/30 terminal-text border border-transparent"
            }`}
          >
            <span className="terminal-glow">● START</span>
          </button>
          {moves.map((move, index) => (
            <button
              key={move.id}
              type="button"
              onClick={() => setMoveIndex(index + 1)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                moveIndex === index + 1
                  ? "bg-primary/20 border border-primary/30 text-primary"
                  : "hover:bg-black/30 terminal-text border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 text-xs ${moveIndex === index + 1 ? "text-primary" : "opacity-70"}`}
                  >
                    {(index + 1).toString().padStart(2, "0")}.
                  </span>
                  <span className="font-mono">{move.move}</span>
                  {!move.is_valid && (
                    <span className="text-red-400 text-[10px]">ERR</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-60">
                  {typeof move.confidence === "number" && (
                    <span>{move.confidence}%</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
