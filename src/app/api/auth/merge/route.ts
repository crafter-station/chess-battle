import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: true, merged: false }), {
      status: 200,
    });
  }

  const cookieStore = await cookies();
  const anonId = cookieStore.get("anon_user_id")?.value;
  if (!anonId || anonId === userId) {
    return new Response(JSON.stringify({ ok: true, merged: false }), {
      status: 200,
    });
  }

  // Reassign ownership from anon -> authed user
  await db.update(schema.battle).set({ user_id: userId }).where(eq(schema.battle.user_id, anonId));
  await db.update(schema.player).set({ user_id: userId }).where(eq(schema.player.user_id, anonId));
  await db.update(schema.move).set({ user_id: userId }).where(eq(schema.move.user_id, anonId));

  // Clear anon cookie after merge
  cookieStore.set("anon_user_id", "", { path: "/", maxAge: 0 });

  return new Response(JSON.stringify({ ok: true, merged: true }), { status: 200 });
}


