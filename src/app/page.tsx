"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import BattleSetup from "./battle-setup";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
  BattlesCollection,
  PlayersCollection,
  TournamentsCollection,
} from "@/db/electric";
import { useEffect, useState } from "react";

// Client-only content component
function ClientContent() {
  const { data: battles } = useLiveQuery((q) =>
    q
      .from({
        battle: BattlesCollection,
      })
      .leftJoin(
        { white_player: PlayersCollection },
        ({ battle, white_player }) =>
          eq(battle.white_player_id, white_player.id)
      )
      .leftJoin(
        { black_player: PlayersCollection },
        ({ battle, black_player }) =>
          eq(battle.black_player_id, black_player.id)
      )
      .orderBy(({ battle }) => battle.created_at, "desc")
      .select(({ battle, white_player, black_player }) => ({
        ...battle,
        white_player,
        black_player,
      }))
  );

  const { data: tournaments } = useLiveQuery((q) =>
    q
      .from({ tournament: TournamentsCollection })
      .orderBy(({ tournament }) => tournament.created_at, "desc")
  );

  return (
    <>
      {/* Tournaments Section */}
      <div className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-xl font-mono flex items-center justify-between">
            <span>&gt; TOURNAMENTS</span>
            <Link
              href="/tournaments"
              className="terminal-text text-sm hover:text-terminal-accent transition-colors"
            >
              + Create Tournament
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!tournaments || tournaments.length === 0 ? (
            <div className="terminal-text text-center py-8 opacity-60">
              &gt; No tournaments found.{" "}
              <Link
                href="/tournaments"
                className="text-terminal-accent hover:underline"
              >
                Create your first tournament
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
                <Card
                  key={tournament.id}
                  className="terminal-card terminal-border hover:border-terminal-accent/50 transition-colors h-full relative"
                >
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="block transition-all hover:scale-[1.02] hover:shadow-lg absolute inset-0"
                  >
                    {" "}
                  </Link>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="terminal-text text-xs"
                        >
                          🏆 TOURNAMENT
                        </Badge>
                        <div className="terminal-text text-xs opacity-50 font-mono">
                          {tournament.id.slice(-8)}
                        </div>
                      </div>

                      <div>
                        <div className="terminal-text font-mono text-lg mb-1">
                          {tournament.name}
                        </div>
                        {tournament.description && (
                          <div className="terminal-text text-sm opacity-70">
                            {tournament.description}
                          </div>
                        )}
                      </div>

                      <div className="terminal-text text-xs opacity-70">
                        {formatDate(tournament.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Battles Section */}
      <div className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-xl font-mono">
            &gt; RECENT BATTLES
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!battles || battles.length === 0 ? (
            <div className="terminal-text text-center py-8 opacity-60">
              &gt; No battles found. Create your first AI chess battle above.
            </div>
          ) : (
            <div className="space-y-4">
              {battles.map((battle) => (
                <Card
                  key={battle.id}
                  className="terminal-card terminal-border hover:border-terminal-accent/50 transition-colors relative"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Tournament Badge */}
                        {battle.tournament_id && (
                          <Badge
                            variant="outline"
                            className="terminal-text text-xs"
                          >
                            🏆 Tournament
                          </Badge>
                        )}

                        {/* White Player */}
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">♔</span>
                          <div>
                            <div className="terminal-text text-xs opacity-70">
                              WHITE
                            </div>
                            <div className="terminal-text font-mono text-sm">
                              {battle.white_player?.model_id}
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
                              {battle.black_player?.model_id}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date, Tournament Link, and Battle ID */}
                      <div className="text-right space-y-1">
                        {battle.tournament_id && (
                          <Link
                            href={`/tournaments/${battle.tournament_id}`}
                            className="terminal-text text-xs text-terminal-accent hover:underline block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Tournament
                          </Link>
                        )}
                        <div className="terminal-text text-xs opacity-70">
                          {formatDate(battle.created_at)}
                        </div>
                        <div className="terminal-text text-xs font-mono">
                          ID: {battle.id.slice(0, 8)}...
                        </div>

                        <Link
                          href={`/battles/${battle.id}`}
                          className="terminal-text text-xs text-terminal-accent hover:underline block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Battle
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </>
  );
}

export default function Page() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen terminal-card crt-flicker">
      <Navbar />

      {/* Welcome Header */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card className="terminal-card terminal-border">
          <CardHeader className="text-center">
            <CardTitle className="terminal-text terminal-glow text-2xl font-mono">
              &gt; AI Chess Battle Command Center
            </CardTitle>
            <div className="terminal-text text-sm opacity-80">
              Create battles, manage tournaments, and watch AI models compete
            </div>
          </CardHeader>
        </Card>
      </div>

      <BattleSetup />

      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {isClient ? (
          <ClientContent />
        ) : (
          <>
            {/* Loading placeholders */}
            <div className="terminal-card terminal-border">
              <CardHeader>
                <CardTitle className="terminal-text terminal-glow text-xl font-mono flex items-center justify-between">
                  <span>&gt; TOURNAMENTS</span>
                  <Link
                    href="/tournaments"
                    className="terminal-text text-sm hover:text-terminal-accent transition-colors"
                  >
                    + Create Tournament
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="terminal-text text-center py-8 opacity-60">
                  &gt; Loading tournaments...
                </div>
              </CardContent>
            </div>

            <div className="terminal-card terminal-border">
              <CardHeader>
                <CardTitle className="terminal-text terminal-glow text-xl font-mono">
                  &gt; RECENT BATTLES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="terminal-text text-center py-8 opacity-60">
                  &gt; Loading battles...
                </div>
              </CardContent>
            </div>
          </>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
