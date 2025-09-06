import { auth } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("POLAR_ACCESS_TOKEN is not set");
}

if (!process.env.NEXT_PUBLIC_URL) {
  throw new Error("NEXT_PUBLIC_URL is not set");
}

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

export const GET = async () => {
  const session = await auth();
  if (!session?.userId) {
    return Response.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_URL));
  }

  try {
    const result = await polar.customerSessions.create({
      externalCustomerId: session.userId,
    });

    return Response.redirect(result.customerPortalUrl);
  } catch (error) {
    console.error(error);
    return Response.redirect(new URL("/", process.env.NEXT_PUBLIC_URL));
  }
};
