import { BattleTask } from "../src/trigger/battle.task";

await BattleTask.trigger({
  battleId: "123",
  userId: "user_456",
});
