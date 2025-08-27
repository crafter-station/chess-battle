"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BattleSetup from "./battle-setup";
import type * as schema from "@/db/schema";
import { formatModelName, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useShape } from "@electric-sql/react";

export default function Page() {
  const { data: battles } = useShape<schema.BattleSelect>({
    url: `${process.env.NEXT_PUBLIC_URL}/api/shapes/battles`,
  });

  return (
    <div className="min-h-screen terminal-card crt-flicker">
      {/* Terminal Header */}
      <div className="terminal-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Card className="terminal-card terminal-border">
            <CardHeader className="text-center">
              <CardTitle className="terminal-text terminal-glow text-3xl font-mono">
                CHESS_BATTLE_SYSTEM.exe
              </CardTitle>
              <div className="terminal-text text-sm opacity-80">
                &gt; AI Chess Battle Setup Terminal
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      <BattleSetup />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="terminal-card terminal-border">
          <CardHeader>
            <CardTitle className="terminal-text terminal-glow text-xl font-mono">
              &gt; BATTLES
            </CardTitle>
          </CardHeader>
          <CardContent>
            {battles.length === 0 ? (
              <div className="terminal-text text-center py-8 opacity-60">
                &gt; No battles found. Create your first AI chess battle above.
              </div>
            ) : (
              <div className="space-y-4">
                {battles.map((battle) => (
                  <Link
                    key={battle.id}
                    href={`/battles/${battle.id}`}
                    className="block transition-all hover:scale-[1.02] hover:shadow-lg"
                  >
                    <Card className="terminal-card terminal-border hover:border-terminal-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* White Player */}
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">♔</span>
                              <div>
                                <div className="terminal-text text-xs opacity-70">
                                  WHITE
                                </div>
                                <div className="terminal-text font-mono text-sm">
                                  {formatModelName(battle.white_player_id)}
                                </div>
                              </div>
                            </div>

                            {/* VS */}
                            <div className="terminal-text text-terminal-accent font-bold">
                              VS
                            </div>

                            {/* Black Player */}
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">♛</span>
                              <div>
                                <div className="terminal-text text-xs opacity-70">
                                  BLACK
                                </div>
                                <div className="terminal-text font-mono text-sm">
                                  {formatModelName(battle.black_player_id)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Date and Battle ID */}
                          <div className="text-right">
                            <div className="terminal-text text-xs opacity-70">
                              {formatDate(battle.created_at)}
                            </div>
                            <div className="terminal-text text-xs font-mono mt-1">
                              ID: {battle.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
}
