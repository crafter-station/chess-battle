import { sql } from "drizzle-orm";

import { db } from "@/db";

const result = await db.execute(
  sql`SELECT canonical_id, pricing_json FROM ai_model`,
);

console.log(result.rows);

const prices: { id: string; inputPrice: number; outputPrice: number }[] = [];

for (const row of result.rows as {
  canonical_id: string;
  pricing_json: {
    providers: {
      inputUsdPerMillion: number;
      outputUsdPerMillion: number;
    }[];
  } | null;
}[]) {
  if (!row.pricing_json) {
    continue;
  }

  const inputPrice = row.pricing_json.providers?.reduce(
    (acc: number, provider) => acc + provider.inputUsdPerMillion,
    0,
  );
  const outputPrice = row.pricing_json.providers?.reduce(
    (acc: number, provider) => acc + provider.outputUsdPerMillion,
    0,
  );

  const providerCount = row?.pricing_json?.providers?.length;

  prices.push({
    id: row.canonical_id,
    inputPrice: inputPrice / providerCount,
    outputPrice: outputPrice / providerCount,
  });
}

prices.sort((a, b) => a.outputPrice - b.outputPrice);

console.log(prices);
console.log(prices.map((p) => p.id));
