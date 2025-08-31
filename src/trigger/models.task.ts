import { logger, schemaTask, task, wait } from "@trigger.dev/sdk";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";

import { MODELS } from "@/lib/models";
import { nanoid } from "@/lib/nanoid";

type MinimalModelExtract = {
  name?: string;
  description?: string;
  logos?: string[];
  chat_url?: string;
};

export const FetchModelDetailsTask = schemaTask({
  id: "fetch-model-details",
  schema: z.object({
    canonicalId: z.string(),
    modelsUrl: z.string().url(),
  }),
  run: async (payload) => {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }

    const jsonSchema: Record<string, any> = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "AI Model Minimal Schema",
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        logos: { type: "array", items: { type: "string" } },
        chat_url: { type: "string" },
      },
    };

    logger.info("Fetching model details via Firecrawl", payload);

    const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: payload.modelsUrl,
        onlyMainContent: true,
        maxAge: 172800000,
        parsers: ["pdf"],
        formats: [
          "markdown",
          {
            type: "json",
            schema: jsonSchema,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      logger.error("Firecrawl HTTP error", {
        status: resp.status,
        body: errText?.slice(0, 500),
      });
      throw new Error(`Firecrawl HTTP ${resp.status}`);
    }

    const doc: any = await resp.json();
    // fallback to root.json or data
    const minimal: MinimalModelExtract | undefined =
      (doc?.data?.json as any) ?? (doc?.json as any) ?? (doc?.data as any);

    if (!minimal || typeof minimal !== "object") {
      logger.warn("Firecrawl returned no parsable JSON payload", {
        keys: Object.keys(doc || {}),
        dataKeys: Object.keys(doc?.data || {}),
      });
    }

    return {
      name: minimal?.name,
      description: minimal?.description,
      logos: minimal?.logos,
      chat_url: minimal?.chat_url,
    } satisfies MinimalModelExtract;
  },
});

// Parent 4 iterate list, fetch &  upsert
export const SyncAIGatewayModelsTask = task({
  id: "sync-ai-gateway-models",
  run: async () => {
    let upserted = 0;

    for (const canonical of MODELS) {
      const [providerRaw, slugRaw] = canonical.split("/");
      if (!providerRaw || !slugRaw) continue;
      const provider = providerRaw.toLowerCase();
      const slug = slugRaw;
      const modelsUrl = `https://vercel.com/ai-gateway/models/${slug}`;

      // Step 1: fetch
      const detailsResult = await FetchModelDetailsTask.triggerAndWait({
        canonicalId: canonical,
        modelsUrl,
      });

      let enriched: MinimalModelExtract | undefined;
      if (detailsResult.ok) {
        enriched = detailsResult.output;
      } else {
        logger.warn(
          "FetchModelDetailsTask failed; proceeding with minimal fields",
          {
            canonical,
            error: detailsResult.error,
          },
        );
      }

      // upsert
      const name = enriched?.name ?? slug.replace(/-/g, " ");
      const description = enriched?.description ?? null;
      const logoUrl =
        Array.isArray(enriched?.logos) && enriched?.logos?.length > 0
          ? enriched?.logos?.[0]
          : null;
      const chatUrl = enriched?.chat_url ?? null;

      try {
        await db
          .insert(schema.ai_model)
          .values({
            id: nanoid(),
            canonical_id: canonical,
            provider,
            name,
            description,
            logo_url: logoUrl,
            models_url: modelsUrl,
            chat_url: chatUrl,
          })
          .onConflictDoUpdate({
            target: [schema.ai_model.canonical_id],
            set: {
              provider,
              name,
              description,
              logo_url: logoUrl,
              models_url: modelsUrl,
              chat_url: chatUrl,
              updated_at: new Date(),
            },
          });
        upserted += 1;
      } catch (e) {
        logger.error("Failed to upsert model", {
          canonicalId: canonical,
          error: String(e),
        });
      }

      // Step 3: wait
      await wait.for({ seconds: 3 });
    }

    return { upserted };
  },
});
