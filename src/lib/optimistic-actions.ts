import { createOptimisticAction } from "@tanstack/react-db";
import {
  battleByIdCollection,
  battlesCollection,
  movesByBattleCollection,
  playersCollection,
} from "@/lib/collections";
import { nanoid } from "@/lib/nanoid";

export type StartBattleOptimisticInput = {
  whitePlayerModelId: string;
  blackPlayerModelId: string;
  battleId?: string;
};

export type StartBattleOptimisticIds = {
  battleId: string;
  whitePlayerId: string;
  blackPlayerId: string;
};

// Applies local optimistic inserts and returns the placeholder IDs.
export function createStartBattleOptimistic(
  submit: (formData: FormData) => Promise<unknown> | undefined,
) {
  return createOptimisticAction<StartBattleOptimisticInput>({
    onMutate: (input) => {
      const now = new Date();
      const battleId = input.battleId ?? nanoid();
      const whitePlayerId = nanoid();
      const blackPlayerId = nanoid();

      playersCollection.insert({
        id: whitePlayerId,
        user_id: "local",
        model_id: input.whitePlayerModelId,
        created_at: now,
      });
      playersCollection.insert({
        id: blackPlayerId,
        user_id: "local",
        model_id: input.blackPlayerModelId,
        created_at: now,
      });

      battlesCollection.insert({
        id: battleId,
        tournament_id: null,
        tournament_round: null,
        tournament_round_position: null,
        winner: null,
        outcome: null,
        user_id: "local",
        white_player_id: whitePlayerId,
        black_player_id: blackPlayerId,
        created_at: now,
      });

      // Also seed per-battle collections so the battle page renders instantly
      battleByIdCollection(battleId).insert({
        id: battleId,
        user_id: "local",
        tournament_id: null,
        tournament_round: null,
        tournament_round_position: null,
        white_player_id: whitePlayerId,
        black_player_id: blackPlayerId,
        winner: null,
        outcome: null,
        created_at: now,
      });
      // Insert a synthetic START move so the board shows immediately
      const INITIAL_FEN =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      movesByBattleCollection(battleId).insert({
        id: `START-${battleId}`,
        user_id: "local",
        battle_id: battleId,
        player_id: whitePlayerId,
        move: "START",
        response_time: null,
        state: INITIAL_FEN,
        is_valid: true,
        tokens_in: null,
        tokens_out: null,
        confidence: null,
        reasoning: null,
        created_at: now,
      });
      // We trigger the server action in mutationFn to avoid duplicate submissions here
    },
    mutationFn: async (input) => {
      const formData = new FormData();
      formData.set("whitePlayerModelId", input.whitePlayerModelId);
      formData.set("blackPlayerModelId", input.blackPlayerModelId);
      if (input.battleId) formData.set("battleId", input.battleId);
      await Promise.resolve(submit(formData));
    },
  });
}
