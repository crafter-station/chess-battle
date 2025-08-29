import { eq } from "@tanstack/react-db";
import { playersCollection, movesByBattleCollection } from "@/lib/collections";
import type { MoveSelect, PlayerSelect } from "@/db/schema";

export type MoveWithPlayer = Pick<
  MoveSelect,
  "id" | "state" | "is_valid" | "move" | "tokens_in" | "tokens_out" | "player_id"
> & {
  player_model_id: string | null;
};

export function buildMovesWithPlayersQuery(battleId: string) {
  return (q: unknown) =>
    (q as any)
      .from({ move: movesByBattleCollection(battleId) })
      .join(
        { player: playersCollection },
        ({ move, player }: { move: MoveSelect; player?: PlayerSelect }) =>
          eq(move.player_id, (player as PlayerSelect).id),
      )
      .select(({ move, player }: { move: MoveSelect; player?: PlayerSelect }) => ({
        ...move,
        player_model_id: player?.model_id ?? null,
      }));
}


