"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";

import {
  BattlesCollection,
  PlayersCollection,
  TournamentsCollection,
} from "@/db/electric";

import { formatDate } from "@/lib/utils";

import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Stable ugly keys for skeleton elements to satisfy lint rules
const SKELETON_TOURNAMENT_KEYS = ["t1", "t2", "t3", "t4", "t5", "t6"];
const SKELETON_BATTLE_KEYS = ["b1", "b2", "b3", "b4", "b5"];

// Client-only content component - dynamically imported to avoid SSR
function ClientContentInternal() {
  // Debounced empty state flags to avoid flash of "not found data" while data hydrates
  const [tournamentsEmptyReady, setTournamentsEmptyReady] = useState(false);
  const [battlesEmptyReady, setBattlesEmptyReady] = useState(false);

  const { data: battles } = useLiveQuery((q) =>
    q
      .from({
        battle: BattlesCollection,
      })
      .leftJoin(
        { white_player: PlayersCollection },
        ({ battle, white_player }) =>
          eq(battle.white_player_id, white_player.id),
      )
      .leftJoin(
        { black_player: PlayersCollection },
        ({ battle, black_player }) =>
          eq(battle.black_player_id, black_player.id),
      )
      .orderBy(({ battle }) => battle.created_at, "desc")
      .select(({ battle, white_player, black_player }) => ({
        ...battle,
        white_player,
        black_player,
      })),
  );

  const { data: tournaments } = useLiveQuery((q) =>
    q
      .from({ tournament: TournamentsCollection })
      .orderBy(({ tournament }) => tournament.created_at, "desc"),
  );

  useEffect(() => {
    if (tournaments === undefined) {
      setTournamentsEmptyReady(false);
      return;
    }
    if (tournaments.length === 0) {
      const timeoutId = setTimeout(() => setTournamentsEmptyReady(true), 300);
      return () => clearTimeout(timeoutId);
    }
    setTournamentsEmptyReady(false);
  }, [tournaments]);

  useEffect(() => {
    if (battles === undefined) {
      setBattlesEmptyReady(false);
      return;
    }
    if (battles.length === 0) {
      const timeoutId = setTimeout(() => setBattlesEmptyReady(true), 300);
      return () => clearTimeout(timeoutId);
    }
    setBattlesEmptyReady(false);
  }, [battles]);

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
          {tournaments === undefined ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SKELETON_TOURNAMENT_KEYS.map((key) => (
                <Card
                  key={`tournament-skel-inline-${key}`}
                  className="terminal-card terminal-border h-full"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            tournamentsEmptyReady ? (
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
                {SKELETON_TOURNAMENT_KEYS.map((key) => (
                  <Card
                    key={`tournament-skel-inline-wait-${key}`}
                    className="terminal-card terminal-border h-full"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
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
          {battles === undefined ? (
            <div className="space-y-4">
              {SKELETON_BATTLE_KEYS.map((key) => (
                <Card
                  key={`battle-skel-inline-${key}`}
                  className="terminal-card terminal-border"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-5 w-24" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-8" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-3 w-24 ml-auto" />
                        <Skeleton className="h-3 w-28 ml-auto" />
                        <Skeleton className="h-3 w-20 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : battles.length === 0 ? (
            battlesEmptyReady ? (
              <div className="terminal-text text-center py-8 opacity-60">
                &gt; No battles found. Create your first AI chess battle above.
              </div>
            ) : (
              <div className="space-y-4">
                {SKELETON_BATTLE_KEYS.map((key) => (
                  <Card
                    key={`battle-skel-inline-wait-${key}`}
                    className="terminal-card terminal-border"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-5 w-24" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-12" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-8" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-12" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-3 w-24 ml-auto" />
                          <Skeleton className="h-3 w-28 ml-auto" />
                          <Skeleton className="h-3 w-20 ml-auto" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
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

// Loading component for while ClientContent is loading
function LoadingContent() {
  return (
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SKELETON_TOURNAMENT_KEYS.map((key) => (
              <Card
                key={`tournament-skel-${key}`}
                className="terminal-card terminal-border h-full"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <div className="space-y-4">
            {SKELETON_BATTLE_KEYS.map((key) => (
              <Card
                key={`battle-skel-${key}`}
                className="terminal-card terminal-border"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-5 w-24" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-8" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-3 w-24 ml-auto" />
                      <Skeleton className="h-3 w-28 ml-auto" />
                      <Skeleton className="h-3 w-20 ml-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </div>
    </>
  );
}

// Dynamic imports to avoid SSR issues with useLiveQuery
const ClientContent = dynamic(() => Promise.resolve(ClientContentInternal), {
  ssr: false,
  loading: () => <LoadingContent />,
});

const BattleSetup = dynamic(() => import("./battle-setup"), {
  ssr: false,
  loading: () => (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Card className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-xl font-mono">
            ⚔️ CONFIGURE BATTLE
          </CardTitle>
          <div className="terminal-text text-sm opacity-80">
            &gt; Loading battle configuration...
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
});

export default function Page() {
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
        <ClientContent />
      </div>

      <div className="h-8" />
    </div>
  );
}
