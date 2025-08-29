import { createOptimisticAction } from "@tanstack/react-db";
import { nanoid } from "@/lib/nanoid";
import { battlesCollection, playersCollection, movesByBattleCollection, battleByIdCollection } from "@/lib/collections";

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
  submit: (formData: FormData) => Promise<unknown> | void,
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
        user_id: "local",
        white_player_id: whitePlayerId,
        black_player_id: blackPlayerId,
        created_at: now,
      });

      // Also seed per-battle collections so the battle page renders instantly
      battleByIdCollection(battleId).insert({
        id: battleId,
        user_id: "local",
        white_player_id: whitePlayerId,
        black_player_id: blackPlayerId,
        created_at: now,
      });
      // Insert a synthetic START move so the board shows immediately
      const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      movesByBattleCollection(battleId).insert({
        id: `START-${battleId}`,
        user_id: "local",
        battle_d: battleId,
        player_id: whitePlayerId,
        move: "START",
        state: INITIAL_FEN,
        is_valid: true,
        tokens_in: null as unknown as number,
        tokens_out: null as unknown as number,
        created_at: now,
      });
      // Persist the optimistic battleId on the form so server uses it
      const formData = new FormData();
      formData.set("whitePlayerModelId", input.whitePlayerModelId);
      formData.set("blackPlayerModelId", input.blackPlayerModelId);
      formData.set("battleId", battleId);
      void submit(formData);
    },
    mutationFn: async (input) => {
      const formData = new FormData();
      formData.set("whitePlayerModelId", input.whitePlayerModelId);
      formData.set("blackPlayerModelId", input.blackPlayerModelId);
      // battleId already sent in onMutate above to reduce delay
      await Promise.resolve(submit(formData));
    },
  });
}


