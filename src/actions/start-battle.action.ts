"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/get-user";
import { nanoid } from "@/lib/nanoid";
import { BattleTask } from "@/trigger/battle.task";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

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

    // Enforce guest battle limit: allow first battle, then require sign-in
    const { userId: authedUserId } = await auth();
    if (!authedUserId) {
      const cookieStore = await cookies();
      const raw = cookieStore.get("guest_battles_count")?.value;
      const count = Number.parseInt(raw || "0", 10) || 0;

      if (count >= 1) {
        return {
          input,
          output: {
            success: false,
            error: "Please sign in to start another battle.",
          },
        };
      }
    }

    // Accept client-provided optimistic battleId when available
    const requestedBattleId = formData.get("battleId")?.toString();
    const battleId = requestedBattleId || nanoid();

    const userId = await getUser();

    const whitePlayerId = nanoid();
    const blackPlayerId = nanoid();

    await db.insert(schema.player).values({
      id: whitePlayerId,
      model_id: input.whitePlayerModelId,
      user_id: userId,
    });

    await db.insert(schema.player).values({
      id: blackPlayerId,
      model_id: input.blackPlayerModelId,
      user_id: userId,
    });

    await db.insert(schema.battle).values({
      id: battleId,
      user_id: userId,
      white_player_id: whitePlayerId,
      black_player_id: blackPlayerId,
    });

    await BattleTask.trigger({
      battleId,
      userId,
    });

    // Increment guest battle count after successful trigger
    if (!authedUserId) {
      const cookieStore = await cookies();
      const raw = cookieStore.get("guest_battles_count")?.value;
      const count = Number.parseInt(raw || "0", 10) || 0;
      cookieStore.set("guest_battles_count", String(count + 1), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return { input, output: { success: true, data: { battleId } } };
  } catch (error) {
    if (error instanceof Error) {
      return { input, output: { success: false, error: error.message } };
    }

    return { input, output: { success: false, error: "Unknown error" } };
  }
}
