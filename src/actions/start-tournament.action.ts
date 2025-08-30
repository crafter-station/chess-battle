"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/get-user";
import { nanoid } from "@/lib/nanoid";
import { TournamentTask } from "@/trigger/tournament.task";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export interface TournamentMatch {
  whitePlayerModelId: string;
  blackPlayerModelId: string;
}

export type StartTournamentActionState = {
  input: {
    tournamentName?: string;
    tournamentSize?: number;
    matches?: TournamentMatch[];
  };
  output:
    | {
        success: true;
        data: {
          tournamentId: string;
        };
      }
    | {
        success: false;
        error?: string;
      };
};

export async function StartTournamentAction(
  _prevState: StartTournamentActionState,
  formData: FormData
): Promise<StartTournamentActionState> {
  const tournamentName = formData.get("tournamentName")?.toString();
  const tournamentSize = Number.parseInt(formData.get("tournamentSize")?.toString() || "0", 10);
  const matchesJson = formData.get("matches")?.toString();
  
  let matches: TournamentMatch[] = [];
  try {
    matches = matchesJson ? JSON.parse(matchesJson) : [];
  } catch {
    return {
      input: { tournamentName, tournamentSize, matches: [] },
      output: { success: false, error: "Invalid matches data" },
    };
  }

  const input: StartTournamentActionState["input"] = {
    tournamentName,
    tournamentSize,
    matches,
  };

  try {
    if (!tournamentName || !tournamentSize || !matches.length) {
      return {
        input,
        output: { success: false, error: "Missing required tournament data" },
      };
    }

    // Validate tournament size matches the number of matches
    const expectedMatches = tournamentSize / 2;
    if (matches.length !== expectedMatches) {
      return {
        input,
        output: { 
          success: false, 
          error: `Expected ${expectedMatches} matches for ${tournamentSize} players, got ${matches.length}` 
        },
      };
    }

    // Validate all matches have both players
    for (const match of matches) {
      if (!match.whitePlayerModelId || !match.blackPlayerModelId) {
        return {
          input,
          output: { success: false, error: "All matches must have both white and black players" },
        };
      }
    }

    // Enforce guest tournament limit: allow first tournament, then require sign-in
    const { userId: authedUserId } = await auth();
    if (!authedUserId) {
      const cookieStore = await cookies();
      const raw = cookieStore.get("guest_tournaments_count")?.value;
      const count = Number.parseInt(raw || "0", 10) || 0;

      if (count >= 1) {
        return {
          input,
          output: {
            success: false,
            error: "Please sign in to start another tournament.",
          },
        };
      }
    }

    const tournamentId = nanoid();
    const userId = await getUser();

    // Create tournament
    await db.insert(schema.tournament).values({
      id: tournamentId,
      user_id: userId,
      name: tournamentName,
      description: `${tournamentSize} player tournament`,
    });

    // Create players and battles for first round
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      const whitePlayerId = nanoid();
      const blackPlayerId = nanoid();
      const battleId = nanoid();

      // Create players
      await db.insert(schema.player).values({
        id: whitePlayerId,
        user_id: userId,
        model_id: match.whitePlayerModelId,
      });

      await db.insert(schema.player).values({
        id: blackPlayerId,
        user_id: userId,
        model_id: match.blackPlayerModelId,
      });

      // Create battle for round 0 (first round)
      await db.insert(schema.battle).values({
        id: battleId,
        user_id: userId,
        tournament_id: tournamentId,
        tournament_round: 0,
        tournament_round_position: i,
        white_player_id: whitePlayerId,
        black_player_id: blackPlayerId,
      });
    }

    // Trigger tournament task
    await TournamentTask.trigger({
      tournamentId,
      userId,
    });

    // Increment guest tournament count after successful trigger
    if (!authedUserId) {
      const cookieStore = await cookies();
      const raw = cookieStore.get("guest_tournaments_count")?.value;
      const count = Number.parseInt(raw || "0", 10) || 0;
      cookieStore.set("guest_tournaments_count", String(count + 1), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return { input, output: { success: true, data: { tournamentId } } };
  } catch (error) {
    if (error instanceof Error) {
      return { input, output: { success: false, error: error.message } };
    }

    return { input, output: { success: false, error: "Unknown error" } };
  }
}
