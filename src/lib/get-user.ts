import { createHash } from "node:crypto";
import { headers } from "next/headers";

export async function getUser() {
  const headersList = await headers(); // TODO: this is not working

  // Get client identifying information
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
