"use client";

import useSWR from "swr";

import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="min-h-screen terminal-card crt-flicker">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <Card className="terminal-card terminal-border">
          <CardHeader>
            <CardTitle className="terminal-text terminal-glow text-2xl font-mono">
              &gt; Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="terminal-text text-center py-12 opacity-70">
                &gt; No data yet. Create battles and come back.
              </div>
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
