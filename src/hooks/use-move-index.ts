import { useParams } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import React from "react";

import { useMoves } from "./use-moves";

export function useMoveIndex() {
  const [index, setMoveIndex] = useQueryState("move", parseAsInteger);

  const { battle_id } = useParams<{ battle_id: string }>();
  const { data: moves } = useMoves(battle_id);

  const moveIndex = React.useMemo(() => {
    if (!moves || !moves.length) {
      return 0;
    }
    if (index === null) {
      return moves.length;
    }
    return index;
  }, [index, moves]);

  return { moveIndex, setMoveIndex };
}
