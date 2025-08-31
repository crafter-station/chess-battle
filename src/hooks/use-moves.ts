import { eq, useLiveQuery } from "@tanstack/react-db";

import { MovesCollection, PlayersCollection } from "@/db/electric";

export function useMoves(battle_id: string) {
  const result = useLiveQuery((q) =>
    q
      .from({ move: MovesCollection })
      .leftJoin({ player: PlayersCollection }, ({ move, player }) =>
        eq(move.player_id, player.id)
      )
      .where(({ move }) => eq(move.battle_id, battle_id))
      .orderBy(({ move }) => move.created_at, "asc")
      .select(({ move, player }) => ({
        ...move,
        player,
      }))
  );

  return {
    ...result,
    data:
      result?.data?.sort(
        (a, b) =>
          new Date(`${a.created_at}Z`).getTime() -
          new Date(`${b.created_at}Z`).getTime()
      ) ?? [],
  };
}
