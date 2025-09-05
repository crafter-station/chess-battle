import { currentUser } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";

import { PRODUCT_NAME } from "@/lib/product-name";

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
  const user = await currentUser();
  if (!user) {
    return Response.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_URL));
  }

  try {
    const result = await polar.customerSessions.create({
      externalCustomerId: user.id,
    });

    return Response.redirect(result.customerPortalUrl);
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message.includes("Customer does not exist")
    ) {
      const products = await polar.products.list({
        query: PRODUCT_NAME,
      });

      const product = products.result.items[0];

      const productId = product.id;

      const result = await polar.checkouts.create({
        products: [productId],
        successUrl: process.env.NEXT_PUBLIC_URL,
        externalCustomerId: user.id,
        customerEmail: user.primaryEmailAddress?.emailAddress,
        customerName: user.fullName,
      });
      return Response.redirect(result.url);
    }

    console.error(error);
    return Response.redirect(new URL("/", process.env.NEXT_PUBLIC_URL));
  }
};
