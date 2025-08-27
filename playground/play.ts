import { BattleTask } from "../src/trigger/battle.task";

await BattleTask.trigger({
  battleId: "123",
  userId: "user_456",
  whitePlayerModelId: "openai/gpt-5-nano",
  blackPlayerModelId: "google/gemini-2.0-flash",
});
