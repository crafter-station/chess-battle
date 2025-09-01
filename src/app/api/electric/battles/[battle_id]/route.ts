import { Pool } from "@neondatabase/serverless";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "@/db/schema";

import { getUser } from "@/lib/get-user";

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error("DATABASE_URL_UNPOOLED is not set");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ battle_id: string }> },
) {
  try {
    const { battle_id } = await params;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL_UNPOOLED,
    });

    const db = drizzle({
      client: pool,
      schema,
    });

    const userId = await getUser();

    const battle = await db.query.battle.findFirst({
      where: and(
        eq(schema.battle.id, battle_id),
        eq(schema.battle.user_id, userId),
      ),
    });

    if (!battle) {
      return Response.json(
        { success: false, error: "Battle not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const result = await db.transaction(async (tx) => {
      await tx
        .update(schema.battle)
        .set({
          timeout_ms: body.timeout_ms,
        })
        .where(eq(schema.battle.id, battle_id));

      const txid = await tx.execute(
        sql`SELECT pg_current_xact_id()::xid::text as txid`,
      );

      return {
        txid: txid.rows[0].txid as string,
      };
    });

    await pool.end();

    return Response.json(
      { success: true, txid: parseInt(result.txid, 10) },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
