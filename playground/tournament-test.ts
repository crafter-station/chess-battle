import { db } from "@/db";
import * as schema from "@/db/schema";
import type { Model } from "@/lib/models";
import { nanoid } from "@/lib/nanoid";
import { TournamentTask } from "@/trigger/tournament.task";

const userId = "user_123";

const tournamentId = nanoid();
await db.insert(schema.tournament).values({
  id: tournamentId,
  name: "Test Tournament",
  user_id: userId,
});

const models = [
  "openai/gpt-4o",
  "anthropic/claude-sonnet-4",
  "openai/gpt-4.1",
  "deepseek/deepseek-v3.1",
] satisfies Model[];

const players = models.map(
  (model) =>
    ({
      id: nanoid(),
      model_id: model,
      user_id: userId,
    } satisfies schema.PlayerInsert)
);

await db.insert(schema.player).values(players);

for (let i = 0; i < players.length / 2; i++) {
  await db.insert(schema.battle).values({
    id: nanoid(),
    tournament_id: tournamentId,
    user_id: userId,
    tournament_round: 0,
    tournament_round_position: i,
    white_player_id: players[i * 2].id,
    black_player_id: players[i * 2 + 1].id,
  });
}

await TournamentTask.trigger({
  tournamentId,
  userId,
});
