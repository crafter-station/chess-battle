import React from "react";
import { useParams } from "next/navigation";
import { useMoves } from "@/hooks/use-moves";
import { useMoveIndex } from "./use-move-index";

export function useCurrentMove() {
  const { battle_id } = useParams<{ battle_id: string }>();

  const { moveIndex } = useMoveIndex();

  const { data: moves } = useMoves(battle_id);

  return React.useMemo(() => {
    if (!moves || !moves.length || moveIndex === 0) {
      return null;
    }

    return moves[moveIndex - 1];
  }, [moves, moveIndex]);
}
