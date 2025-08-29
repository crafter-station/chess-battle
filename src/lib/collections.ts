import { createCollection } from "@tanstack/react-db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import type { BattleSelect, MoveSelect, PlayerSelect } from "@/db/schema";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "";

export const battlesCollection = createCollection<BattleSelect>(
  electricCollectionOptions<BattleSelect>({
    id: "battles",
    shapeOptions: {
      url: `${BASE_URL}/api/shapes/battles`,
    },
    getKey: (item) => item.id,
  })
);

export const playersCollection = createCollection<PlayerSelect>(
  electricCollectionOptions<PlayerSelect>({
    id: "players",
    shapeOptions: {
      url: `${BASE_URL}/api/shapes/players`,
    },
    getKey: (item) => item.id,
  })
);

export function battleByIdCollection(battleId: string) {
  return createCollection<BattleSelect>(
    electricCollectionOptions<BattleSelect>({
      id: `battle-${battleId}`,
      shapeOptions: {
        url: `${BASE_URL}/api/shapes/battles/${battleId}`,
      },
      getKey: (item) => item.id,
    })
  );
}

export function movesByBattleCollection(battleId: string) {
  return createCollection<MoveSelect>(
    electricCollectionOptions<MoveSelect>({
      id: `moves-${battleId}`,
      shapeOptions: {
        url: `${BASE_URL}/api/shapes/battles/${battleId}/moves`,
      },
      getKey: (item) => item.id,
    })
  );
}

export function playerByIdCollection(playerId: string) {
  return createCollection<PlayerSelect>(
    electricCollectionOptions<PlayerSelect>({
      id: `player-${playerId}`,
      shapeOptions: {
        url: `${BASE_URL}/api/shapes/players/${playerId}`,
      },
      getKey: (item) => item.id,
    })
  );
}
