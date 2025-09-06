import { currentUser } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";
import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate.js";

import { FREE_BENEFIT_NAME, PRODUCT_NAME } from "@/lib/product-name";

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("POLAR_ACCESS_TOKEN is not set");
}
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

type SuccessResult = {
  userId: string;
  meters: { id: string; name: string; balance: number }[];
  freeBenefitGranted: boolean;
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
    const user = await currentUser();

    if (!user?.id) {
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
        externalId: user.id,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Not found")) {
          const createdCustomer = await polar.customers.create({
            externalId: user.id,
            email: user.emailAddresses[0].emailAddress,
            name: user.fullName,
          });

          customer = await polar.customers.getState({
            id: createdCustomer.id,
          });
        }
      } else {
        throw error;
      }
    }

    if (!customer) {
      throw new Error("Customer not found");
    }

    const freeBenefits = await polar.benefits.list({
      query: FREE_BENEFIT_NAME,
    });
    const freeBenefit = freeBenefits.result.items[0];

    const freeBenefitGranted = customer.grantedBenefits.some(
      (benefit) => benefit.benefitId === freeBenefit.id,
    );

    const products = await polar.products.list({
      query: PRODUCT_NAME,
    });

    console.log(JSON.stringify(customer, null, 2));

    console.log(JSON.stringify(products.result.items, null, 2));

    const product = products.result.items[0];

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
          userId: user.id,
          freeBenefitGranted: freeBenefitGranted,
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
