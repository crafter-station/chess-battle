import { auth } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";

import { nanoid } from "@/lib/nanoid";
import {
  FREE_BENEFIT_NAME,
  FREE_DISCOUNT_CODE,
  FREE_PRODUCT_NAME,
  PRODUCT_NAME,
} from "@/lib/product-name";

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

  const freeBenefits = await polar.benefits.list({
    query: FREE_BENEFIT_NAME,
  });
  const freeBenefit = freeBenefits.result.items[0];

  const customerState = await polar.customers.getStateExternal({
    externalId: session.userId,
  });

  let checkoutUrl = process.env.NEXT_PUBLIC_URL;

  if (
    customerState.grantedBenefits.find(
      (benefit) => benefit.benefitId === freeBenefit.id,
    )
  ) {
    const products = await polar.products.list({
      query: PRODUCT_NAME,
    });

    const product = products.result.items[0];

    const productId = product.id;

    const result = await polar.checkouts.create({
      products: [productId],
      successUrl: process.env.NEXT_PUBLIC_URL,
      externalCustomerId: session.userId,
    });

    checkoutUrl = result.url;
  } else {
    const products = await polar.products.list({
      query: FREE_PRODUCT_NAME,
    });

    const product = products.result.items[0];

    const productId = product.id;

    const code = nanoid();
    const discount = await polar.discounts.create({
      type: "percentage",
      basisPoints: 10000,
      products: [productId],
      name: FREE_DISCOUNT_CODE,
      code: code,
      duration: "forever",
      maxRedemptions: 1,
    });

    const result = await polar.checkouts.create({
      products: [productId],
      successUrl: process.env.NEXT_PUBLIC_URL,
      externalCustomerId: session.userId,
      discountId: discount.id,
    });

    checkoutUrl = result.url;
  }

  return Response.redirect(checkoutUrl);
};
