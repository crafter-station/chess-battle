"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";
import useSWR from "swr";

import { AIModelsCollection } from "@/db/electric";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ModelRow = {
  modelId: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  avgResponseTimeMs: number | null;
  rating: number | null;
};

// Provider logos map (same as in page.tsx)
const PROVIDER_LOGOS = {
  alibaba: "https://avatars.githubusercontent.com/u/137491736?s=200&v=4", // Qwen
  anthropic: "https://avatars.githubusercontent.com/u/46360699?s=200&v=4", // Claude
  openai: "https://avatars.githubusercontent.com/u/14957082?s=200&v=4", // OpenAI
  cohere: "https://avatars.githubusercontent.com/u/29539506?s=200&v=4", // Cohere
  xai: "https://avatars.githubusercontent.com/u/150673994?s=200&v=4", // xAI/Grok
  google: "https://avatars.githubusercontent.com/u/1342004?s=200&v=4", // Google/Gemini
  deepseek: "https://avatars.githubusercontent.com/u/139544350?s=200&v=4", // DeepSeek
  moonshotai: "https://avatars.githubusercontent.com/u/126165481?s=200&v=4", // Moonshot/Kimi
} as const;

// Model icon component
function ModelIcon({
  modelId,
  allModels,
}: {
  modelId: string;
  allModels?: Array<{
    canonical_id: string;
    name?: string | null;
    logo_url?: string | null;
  }> | null;
}) {
  const model = allModels?.find((m) => m.canonical_id === modelId);

  // Use model's logo_url first
  if (model?.logo_url) {
    return (
      <Image
        src={model.logo_url}
        alt={model.name || model.canonical_id}
        width={20}
        height={20}
        className="w-5 h-5 rounded shrink-0 object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Fallback to provider logos if no model logo_url
  const provider = modelId?.split("/")[0] as keyof typeof PROVIDER_LOGOS;
  const providerLogo = provider ? PROVIDER_LOGOS[provider] : null;

  if (providerLogo) {
    return (
      <Image
        src={providerLogo}
        alt={provider || "AI Model"}
        width={20}
        height={20}
        className="w-5 h-5 rounded shrink-0 object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Final fallback to brain emoji
  return (
    <div className="w-5 h-5 rounded bg-terminal-border flex items-center justify-center text-xs opacity-70 shrink-0">
      🧠
    </div>
  );
}

// Stable keys for skeleton elements to satisfy lint rules
const SKELETON_HEADER_KEYS = [
  "rank",
  "model",
  "rating",
  "games",
  "wins",
  "draws",
  "losses",
  "tokensIn",
  "tokensOut",
  "totalTokens",
  "avgRt",
];
const SKELETON_ROW_KEYS = ["row1", "row2", "row3", "row4", "row5", "row6"];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LeaderboardPage() {
  const { data } = useSWR<{ success: boolean; data: ModelRow[] }>(
    "/api/leaderboard",
    fetcher,
    {
      refreshInterval: 5000,
    },
  );

  // Get all AI models for logo lookup
  const { data: allModels } = useLiveQuery((q) =>
    q.from({ model: AIModelsCollection }).select(({ model }) => ({
      canonical_id: model.canonical_id,
      name: model.name,
      description: model.description,
      logo_url: model.logo_url,
      provider: model.provider,
    })),
  );

  const rows = data?.data ?? [];
  const [emptyReady, setEmptyReady] = useState(false);

  // Debounce the empty state to avoid flashing "No data yet" during hydration
  useEffect(() => {
    if (data === undefined) {
      setEmptyReady(false);
      return;
    }
    if (rows.length === 0) {
      const timeoutId = setTimeout(() => setEmptyReady(true), 300);
      return () => clearTimeout(timeoutId);
    }
    setEmptyReady(false);
  }, [data, rows.length]);

  return (
    <div className="min-h-screen bg-background crt-flicker">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <Card className="terminal-card terminal-border">
          <CardHeader>
            <CardTitle className="terminal-text terminal-glow text-2xl font-mono flex items-center gap-3">
              <span className="text-primary">🏆</span>
              LEADERBOARD
              <span className="text-xs opacity-50 font-mono">ELO RANKINGS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data === undefined ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="terminal-text text-xs opacity-70 bg-black/40 border-b border-white/20">
                      {SKELETON_HEADER_KEYS.map((key) => (
                        <th key={`head-skel-${key}`} className="p-3">
                          <Skeleton className="h-4 w-20" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SKELETON_ROW_KEYS.map((rowKey) => (
                      <tr
                        key={`row-skel-${rowKey}`}
                        className="border-b border-white/10"
                      >
                        {SKELETON_HEADER_KEYS.map((colKey) => (
                          <td
                            key={`cell-skel-${rowKey}-${colKey}`}
                            className="p-2"
                          >
                            <Skeleton className="h-4 w-16" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : rows.length === 0 ? (
              emptyReady ? (
                <div className="terminal-text text-center py-12 opacity-70">
                  &gt; No data yet. Create battles and come back.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="terminal-text text-xs opacity-70 bg-black/40 border-b border-white/20">
                        {SKELETON_HEADER_KEYS.map((key) => (
                          <th key={`head-skel-wait-${key}`} className="p-3">
                            <Skeleton className="h-4 w-20" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SKELETON_ROW_KEYS.map((rowKey) => (
                        <tr
                          key={`row-skel-wait-${rowKey}`}
                          className="border-b border-white/10"
                        >
                          {SKELETON_HEADER_KEYS.map((colKey) => (
                            <td
                              key={`cell-skel-wait-${rowKey}-${colKey}`}
                              className="p-2"
                            >
                              <Skeleton className="h-4 w-16" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="terminal-text text-xs opacity-70 bg-black/40 border-b border-white/20">
                      <th className="p-3">#</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Games</th>
                      <th className="p-3">W</th>
                      <th className="p-3">D</th>
                      <th className="p-3">L</th>
                      <th className="p-3">Tokens In</th>
                      <th className="p-3">Tokens Out</th>
                      <th className="p-3">Total Tokens</th>
                      <th className="p-3">Avg RT (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={r.modelId}
                        className="terminal-text border-b border-white/10"
                      >
                        <td className="p-2 text-xs opacity-70">{i + 1}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <ModelIcon
                              modelId={r.modelId}
                              allModels={allModels}
                            />
                            <span className="font-mono text-sm text-terminal-accent">
                              {r.modelId}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          {r.rating ? (
                            <Badge
                              variant="secondary"
                              className="bg-primary/20 border-primary/30 text-primary font-mono text-sm px-2 py-1"
                            >
                              {r.rating}
                            </Badge>
                          ) : (
                            <span className="text-sm opacity-50">-</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">{r.games}</td>
                        <td className="p-2 text-sm">{r.wins}</td>
                        <td className="p-2 text-sm">{r.draws}</td>
                        <td className="p-2 text-sm">{r.losses}</td>
                        <td className="p-2 text-sm">{r.tokensIn}</td>
                        <td className="p-2 text-sm">{r.tokensOut}</td>
                        <td className="p-2 text-sm">{r.totalTokens}</td>
                        <td className="p-2 text-sm">
                          {r.avgResponseTimeMs ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
