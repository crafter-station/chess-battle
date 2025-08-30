import { batch, schemaTask } from "@trigger.dev/sdk";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { BattleTask } from "./battle.task";
import { nanoid } from "@/lib/nanoid";

export const TournamentTask = schemaTask({
  id: "tournament",
  schema: z.object({
    tournamentId: z.string(),
    userId: z.string(),
  }),
  run: async (payload) => {
    const tournament = await db.query.tournament.findFirst({
      where: and(
        eq(schema.tournament.id, payload.tournamentId),
        eq(schema.tournament.user_id, payload.userId)
      ),
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    let round = 0;
    while (true) {
      const battles = await db.query.battle.findMany({
        where: and(
          eq(schema.battle.tournament_id, payload.tournamentId),
          eq(schema.battle.user_id, payload.userId),
          eq(schema.battle.tournament_round, round)
        ),
      });

      await batch.triggerByTaskAndWait<(typeof BattleTask)[]>(
        battles.map((b) => ({
          payload: {
            battleId: b.id,
            userId: payload.userId,
          },
          task: BattleTask,
        }))
      );

      const roundBattles = await db.query.battle.findMany({
        where: and(
          eq(schema.battle.tournament_id, payload.tournamentId),
          eq(schema.battle.user_id, payload.userId),
          eq(schema.battle.tournament_round, round)
        ),
        orderBy: [asc(schema.battle.tournament_round_position)],
      });

      if (roundBattles.length < 2) {
        break;
      }

      for (let i = 0; i < roundBattles.length / 2; i++) {
        const oddBattle = roundBattles.find(
          (b) => b.tournament_round_position === i * 2
        );
        const evenBattle = roundBattles.find(
          (b) => b.tournament_round_position === i * 2 + 1
        );

        if (!oddBattle || !evenBattle) {
          throw new Error("Battle not found");
        }
        const whitePlayerId =
          oddBattle.winner === "white"
            ? oddBattle.white_player_id
            : oddBattle.black_player_id;

        const blackPlayerId =
          evenBattle.winner === "white"
            ? evenBattle.white_player_id
            : evenBattle.black_player_id;

        await db.insert(schema.battle).values({
          id: nanoid(),
          tournament_id: payload.tournamentId,
          user_id: payload.userId,
          tournament_round: round + 1,
          tournament_round_position: i,
          white_player_id: whitePlayerId,
          black_player_id: blackPlayerId,
        });
      }

      round++;
    }
  },
});
