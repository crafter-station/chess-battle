import { NextResponse } from "next/server";

import { desc, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

type ModelStats = {
  modelId: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  avgResponseTimeMs: number | null;
  rating: number | null;
};

export async function GET() {
  try {
    const [players, battles, moves, ratings] = await Promise.all([
      db.select().from(schema.player),
      db.query.battle.findMany({ where: isNotNull(schema.battle.outcome) }),
      db.select().from(schema.move),
      db
        .select()
        .from(schema.player_rating)
        .orderBy(desc(schema.player_rating.created_at)),
    ]);

    const playerIdToModelId = new Map<string, string>();
    for (const p of players) {
      playerIdToModelId.set(p.id, p.model_id);
    }

    const latestRatingByPlayer = new Map<string, { rating: number }>();
    for (const r of ratings) {
      if (!r.player_id) continue;
      if (!latestRatingByPlayer.has(r.player_id)) {
        latestRatingByPlayer.set(r.player_id, { rating: r.rating });
      }
    }

    const stats = new Map<string, ModelStats>();
    function ensure(modelId: string): ModelStats {
      let s = stats.get(modelId);
      if (!s) {
        s = {
          modelId,
          games: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          tokensIn: 0,
          tokensOut: 0,
          totalTokens: 0,
          avgResponseTimeMs: null,
          rating: null,
        };
        stats.set(modelId, s);
      }
      return s;
    }

    for (const b of battles) {
      const whiteModel = playerIdToModelId.get(b.white_player_id);
      const blackModel = playerIdToModelId.get(b.black_player_id);
      if (!whiteModel || !blackModel) continue;
      ensure(whiteModel).games += 1;
      ensure(blackModel).games += 1;

      if (b.outcome === "draw") {
        ensure(whiteModel).draws += 1;
        ensure(blackModel).draws += 1;
      } else if (b.outcome === "win" && b.winner) {
        if (b.winner === "white") {
          ensure(whiteModel).wins += 1;
          ensure(blackModel).losses += 1;
        } else if (b.winner === "black") {
          ensure(blackModel).wins += 1;
          ensure(whiteModel).losses += 1;
        }
      }
    }

    const responseTimeAcc: Record<string, { sum: number; count: number }> = {};
    for (const m of moves) {
      const modelId = playerIdToModelId.get(m.player_id);
      if (!modelId) continue;
      const s = ensure(modelId);
      if (m.tokens_in != null) s.tokensIn += m.tokens_in;
      if (m.tokens_out != null) s.tokensOut += m.tokens_out;
      s.totalTokens = s.tokensIn + s.tokensOut;
      if (m.response_time != null) {
        const existing = responseTimeAcc[modelId];
        const acc = existing ?? { sum: 0, count: 0 };
        responseTimeAcc[modelId] = acc;
        acc.sum += m.response_time;
        acc.count += 1;
      }
    }

    for (const [modelId, acc] of Object.entries(responseTimeAcc)) {
      const s = ensure(modelId);
      s.avgResponseTimeMs =
        acc.count > 0 ? Math.round(acc.sum / acc.count) : null;
    }

    const ratingsByModel = new Map<string, { sum: number; count: number }>();
    for (const [playerId, r] of latestRatingByPlayer) {
      const modelId = playerIdToModelId.get(playerId);
      if (!modelId) continue;
      const agg = ratingsByModel.get(modelId) || { sum: 0, count: 0 };
      agg.sum += r.rating;
      agg.count += 1;
      ratingsByModel.set(modelId, agg);
    }
    for (const [modelId, agg] of ratingsByModel) {
      const s = ensure(modelId);
      s.rating = agg.count > 0 ? Math.round(agg.sum / agg.count) : null;
    }

    const result = Array.from(stats.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if ((b.rating ?? 0) !== (a.rating ?? 0))
        return (b.rating ?? 0) - (a.rating ?? 0);
      return b.games - a.games;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
