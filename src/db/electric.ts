import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

import type {
  BattleSelect,
  MoveSelect,
  PlayerSelect,
  TournamentSelect,
} from "./schema";

export const BattlesCollection = createCollection<BattleSelect>(
  electricCollectionOptions<BattleSelect>({
    id: "battlesCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/battles`,
    },
    getKey: (item) => item.id,
  })
);

export const TournamentsCollection = createCollection<TournamentSelect>(
  electricCollectionOptions<TournamentSelect>({
    id: "tournamentsCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/tournaments`,
    },
    getKey: (item) => item.id,
  })
);

export const PlayersCollection = createCollection<PlayerSelect>(
  electricCollectionOptions<PlayerSelect>({
    id: "playersCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/players`,
    },
    getKey: (item) => item.id,
  })
);

export const MovesCollection = createCollection<MoveSelect>(
  electricCollectionOptions<MoveSelect>({
    id: "movesCollection",
    shapeOptions: {
      url: `${process.env.NEXT_PUBLIC_URL}/api/electric/moves`,
    },
    getKey: (item) => item.id,
  })
);
