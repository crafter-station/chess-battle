import { NextResponse } from "next/server";
import { db } from "@/db";
import type * as schema from "@/db/schema";

export async function GET() {
  try {
    // Basic list for UI model selection
    const rows = await db.query.ai_model.findMany({
      columns: {
        id: true,
        canonical_id: true,
        provider: true,
        name: true,
        description: true,
        logo_url: true,
        models_url: true,
        chat_url: true,
      },
      // Drizzle type inference can be tricky here; cast callback args
      orderBy: ((
        tbl: typeof schema.ai_model,
        utils: { asc: (c: any) => any },
      ) => [utils.asc(tbl.provider), utils.asc(tbl.name)]) as any,
    } as any);

    return NextResponse.json({ models: rows ?? [] });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to list models" },
      { status: 500 },
    );
  }
}
