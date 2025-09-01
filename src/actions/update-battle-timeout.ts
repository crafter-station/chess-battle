"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

import { getUser } from "@/lib/get-user";

export type UpdateBattleTimeoutActionState = {
  input: {
    timeoutMs?: number;
    battleId?: string;
  };
  output:
    | {
        success: true;
        data: {
          battleId: string;
          timeoutMs: number;
        };
      }
    | {
        success: false;
        error?: string;
      };
};

export async function UpdateBattleTimeoutAction(
  _prevState: UpdateBattleTimeoutActionState,
  formData: FormData,
): Promise<UpdateBattleTimeoutActionState> {
  const input: UpdateBattleTimeoutActionState["input"] = {
    timeoutMs: Number(formData.get("timeout_ms")?.toString()),
    battleId: formData.get("battle_id")?.toString(),
  };

  try {
    if (!input.timeoutMs || !input.battleId) {
      return {
        input,
        output: { success: false, error: "Missing required fields" },
      };
    }

    const userId = await getUser();

    const result = await db
      .update(schema.battle)
      .set({
        timeout_ms: input.timeoutMs,
      })
      .where(
        and(
          eq(schema.battle.id, input.battleId),
          eq(schema.battle.user_id, userId),
        ),
      );

    if (result.rowCount === 0) {
      return {
        input,
        output: { success: false, error: "Battle not found" },
      };
    } else {
      return {
        input,
        output: {
          success: true,
          data: { battleId: input.battleId, timeoutMs: input.timeoutMs },
        },
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { input, output: { success: false, error: error.message } };
    }

    return { input, output: { success: false, error: "Unknown error" } };
  }
}
