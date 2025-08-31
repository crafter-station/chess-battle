import { createHash } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { nanoid } from "@/lib/nanoid";

export async function getUser() {
  // Prefer Clerk userId when authenticated
  const { userId } = await auth();
  if (userId) return userId;

  // Fallback: deterministic anonymous user ID from request headers
  const cookieStore = await cookies();
  const existingAnon = cookieStore.get("anon_user_id")?.value;
  if (existingAnon) return existingAnon;

  const newAnon = `anon_${nanoid()}`;
  cookieStore.set("anon_user_id", newAnon, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "unknown-ip";

  const userAgent = headersList.get("user-agent") || "unknown-ua";
  const acceptLanguage = headersList.get("accept-language") || "unknown-lang";
  const acceptEncoding =
    headersList.get("accept-encoding") || "unknown-encoding";

  // Get the auth hash key from environment
  const authHashKey = process.env.AUTH_HASH_KEY || "default-key";

  // Create a unique string from client metadata and auth key
  const clientFingerprint = [
    authHashKey,
    ip,
    userAgent,
    acceptLanguage,
    acceptEncoding,
  ].join("|");

  // Generate a consistent hash from the fingerprint
  const hash = createHash("sha256").update(clientFingerprint).digest("hex");

  // Return first 16 characters for a shorter, more manageable ID
  return `user_${hash.substring(0, 16)}`;
}
