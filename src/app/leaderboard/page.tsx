"use client";

import { useEffect, useState } from "react";

import useSWR from "swr";

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
            <CardTitle className="terminal-text terminal-glow text-2xl font-mono">
              &gt; Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data === undefined ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="terminal-text text-xs opacity-70">
                      {SKELETON_HEADER_KEYS.map((key) => (
                        <th key={`head-skel-${key}`} className="p-2">
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
                      <tr className="terminal-text text-xs opacity-70">
                        {SKELETON_HEADER_KEYS.map((key) => (
                          <th key={`head-skel-wait-${key}`} className="p-2">
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
                    <tr className="terminal-text text-xs opacity-70">
                      <th className="p-2">#</th>
                      <th className="p-2">Model</th>
                      <th className="p-2">Rating</th>
                      <th className="p-2">Games</th>
                      <th className="p-2">W</th>
                      <th className="p-2">D</th>
                      <th className="p-2">L</th>
                      <th className="p-2">Tokens In</th>
                      <th className="p-2">Tokens Out</th>
                      <th className="p-2">Total Tokens</th>
                      <th className="p-2">Avg RT (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={r.modelId}
                        className="terminal-text border-b border-white/10"
                      >
                        <td className="p-2 text-xs opacity-70">{i + 1}</td>
                        <td className="p-2 font-mono text-sm">
                          <span className="text-terminal-accent">
                            {r.modelId}
                          </span>
                        </td>
                        <td className="p-2 text-sm">{r.rating ?? "-"}</td>
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
