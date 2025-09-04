import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const battleId = url.searchParams.get("battleId");

  if (!battleId) {
    return Response.json({ error: "Missing battleId" }, { status: 400 });
  }

  // Optional: Limit to signed-in users; allow guests for now
  const { userId } = await auth();
  const scopes = {
    read: {
      tags: [`battle:${battleId}`],
    },
  };

  try {
    const token = await triggerAuth.createPublicToken({
      scopes,
      // Short TTL; client reconnects if needed
      expirationTime: "30m",
    });

    return Response.json({ token, userId: userId ?? null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Token error" },
      { status: 500 },
    );
  }
}
