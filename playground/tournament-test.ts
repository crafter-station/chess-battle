import { db } from "@/db";
import * as schema from "@/db/schema";
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
  "alibaba/qwen-3-14b",
  "alibaba/qwen-3-235b",
  "alibaba/qwen-3-30b",
  "alibaba/qwen-3-32b",
  "alibaba/qwen3-coder",
  "amazon/nova-lite",
  "amazon/nova-micro",
  "amazon/nova-pro",
];

const players = models.map((model) => ({
  id: nanoid(),
  name: model,
  model_id: model,
  user_id: userId,
}));

await db.insert(schema.player).values(players);

for (let i = 0; i < players.length / 2; i++) {
  await db.insert(schema.battle).values({
    id: nanoid(),
    tournament_id: tournamentId,
    user_id: userId,
    tournament_round: 0,
    tournament_round_position: i,
    white_player_id: players[i].id,
    black_player_id: players[i + 1].id,
  });
}

await TournamentTask.trigger({
  tournamentId,
  userId,
});
