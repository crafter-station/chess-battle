import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";
import { toast } from "sonner";

import type {
  AIModelSelect,
  BattleSelect,
  MoveSelect,
  PlayerSelect,
  TournamentSelect,
} from "./schema";

export const BattlesCollection = createCollection<
  BattleSelect & { created_at: string }
>(
  electricCollectionOptions<BattleSelect & { created_at: string }>({
    id: "battlesCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/battles`,
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      const newItem = transaction.mutations[0].modified;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/electric/battles/${newItem.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            timeout_ms: newItem.timeout_ms,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update battle timeout");
      }
      const data = (await response.json()) as {
        success: boolean;
        txid: number;
      };

      if (!data.success) {
        throw new Error("Failed to update battle timeout");
      }

      toast.success("Battle timeout updated");

      return {
        txid: data.txid,
      };
    },
  }),
);

export const TournamentsCollection = createCollection<
  TournamentSelect & { created_at: string }
>(
  electricCollectionOptions<TournamentSelect & { created_at: string }>({
    id: "tournamentsCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/tournaments`,
    },
    getKey: (item) => item.id,
  }),
);

export const PlayersCollection = createCollection<
  PlayerSelect & { created_at: string }
>(
  electricCollectionOptions<PlayerSelect & { created_at: string }>({
    id: "playersCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/players`,
    },
    getKey: (item) => item.id,
  }),
);

export const MovesCollection = createCollection<
  Omit<MoveSelect, "created_at"> & { created_at: string }
>(
  electricCollectionOptions<
    Omit<MoveSelect, "created_at"> & { created_at: string }
  >({
    id: "movesCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/moves`,
    },
    getKey: (item) => item.id,
  }),
);

export const AIModelsCollection = createCollection<
  AIModelSelect & { created_at: string }
>(
  electricCollectionOptions<AIModelSelect & { created_at: string }>({
    id: "AIModelsCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/ai-models`,
    },
    getKey: (item) => item.id,
  }),
);
