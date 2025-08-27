"use server";

import { nanoid } from "@/lib/nanoid";
import { BattleTask } from "@/trigger/battle.task";

export type StartBattleActionState = {
  input: {
    whitePlayerModelId?: string;
    blackPlayerModelId?: string;
  };
  output:
    | {
        success: true;
        data: {
          battleId: string;
        };
      }
    | {
        success: false;
        error?: string;
      };
};

export async function StartBattleAction(
  _prevState: StartBattleActionState,
  formData: FormData
): Promise<StartBattleActionState> {
  const input: StartBattleActionState["input"] = {
    whitePlayerModelId: formData.get("whitePlayerModelId")?.toString(),
    blackPlayerModelId: formData.get("blackPlayerModelId")?.toString(),
  };

  try {
    if (!input.whitePlayerModelId || !input.blackPlayerModelId) {
      return {
        input,
        output: { success: false, error: "Missing required fields" },
      };
    }

    const battleId = nanoid();

    await BattleTask.trigger({
      battleId,
      whitePlayerModelId: input.whitePlayerModelId,
      blackPlayerModelId: input.blackPlayerModelId,
    });

    return { input, output: { success: true, data: { battleId } } };
  } catch (error) {
    if (error instanceof Error) {
      return { input, output: { success: false, error: error.message } };
    }

    return { input, output: { success: false, error: "Unknown error" } };
  }
}
