import { BattleTask } from "../src/trigger/battle.task";

await BattleTask.trigger({
  whitePlayerModelId: "openai/gpt-5-nano",
  blackPlayerModelId: "google/gemini-2.0-flash",
});