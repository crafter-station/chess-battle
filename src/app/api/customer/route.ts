import { auth } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";
import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate.js";

import { PRODUCT_NAME } from "@/lib/product-name";

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("POLAR_ACCESS_TOKEN is not set");
}
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

type SuccessResult = {
  userId: string;
  productId: string;
  meters: { id: string; name: string; balance: number }[];
  isCustomer: boolean;
};

type ErrorResult = {
  error: string;
  detail: string;
};

export type CustomerResult =
  | {
      success: true;
      data: SuccessResult;
    }
  | ({
      success: false;
    } & ErrorResult);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
          detail: "Unauthorized",
        } satisfies CustomerResult),
        {
          status: 401,
        },
      );
    }

    let customer: CustomerState | null = null;

    try {
      customer = await polar.customers.getStateExternal({
        externalId: session.userId,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Not found")) {
          customer = null;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const products = await polar.products.list({
      query: PRODUCT_NAME,
    });

    const product = products.result.items[0];

    const productId = product.id;

    const meters = product.benefits;

    const userMeters: { id: string; name: string; balance: number }[] = [];

    if (customer) {
      for (const userMeter of customer.activeMeters) {
        const meterData = meters.find(
          // @ts-expect-error
          (m) => m.properties.meterId === userMeter.meterId,
        );
        if (meterData) {
          userMeters.push({
            id: userMeter.id,
            name: meterData.description,
            balance: userMeter.balance,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId: session.userId,
          productId: productId,
          meters: userMeters,
          isCustomer: customer !== null,
        },
      } satisfies CustomerResult),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch customer",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      },
    );
  }
}
