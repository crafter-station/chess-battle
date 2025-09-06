"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";

import {
  AIModelsCollection,
  BattlesCollection,
  PlayersCollection,
  TournamentsCollection,
} from "@/db/electric";

import { BattlesSection } from "@/components/home/battles-section";
import { StatsLine } from "@/components/home/stats-line";
import { TournamentsSection } from "@/components/home/tournaments-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ClientContentInternal() {
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

  const { data: allModels } = useLiveQuery((q) =>
    q.from({ model: AIModelsCollection }).select(({ model }) => ({
      canonical_id: model.canonical_id,
      name: model.name,
      description: model.description,
      logo_url: model.logo_url,
      provider: model.provider,
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
    <div className="space-y-6">
      <StatsLine tournaments={tournaments} battles={battles} />

      <TournamentsSection
        tournaments={tournaments}
        tournamentsEmptyReady={tournamentsEmptyReady}
      />

      <BattlesSection
        battles={battles}
        battlesEmptyReady={battlesEmptyReady}
        allModels={allModels}
      />
    </div>
  );
}

function LoadingContent() {
  return (
    <div className="space-y-6">
      <StatsLine />

      <Card className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-lg font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-primary">🏆</span>
              TOURNAMENTS
            </span>
            <Link
              href="/tournaments"
              className="flex items-center gap-2 terminal-text text-xs hover:text-primary transition-colors px-3 py-1.5 border border-primary/30 rounded-md hover:bg-primary/10 group"
            >
              <span className="group-hover:scale-110 transition-transform">
                ⚡
              </span>
              Create
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Card
                key={`tournament-skeleton-${i + 1}`}
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
      </Card>

      <Card className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-lg font-mono flex items-center gap-2">
            <span className="text-accent">⚔️</span>
            RECENT BATTLES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Card
                key={`battle-skeleton-${i + 1}`}
                className="terminal-card terminal-border h-full"
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/10">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-md bg-gray-800/30 border border-gray-600/20">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-terminal-accent/20">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dynamic imports to avoid SSR issues with useLiveQuery
const ClientContent = dynamic(() => Promise.resolve(ClientContentInternal), {
  ssr: false,
  loading: () => <LoadingContent />,
});

const BattleSetup = dynamic(() => import("./battle-setup"), {
  ssr: false,
  loading: () => {
    const { BattleSetupLoading } = require("./battle-setup-loading");
    return <BattleSetupLoading />;
  },
});

export default function Page() {
  return (
    <div className="min-h-screen bg-background crt-flicker">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="text-primary"
                >
                  <title>Chess Icon</title>
                  <path
                    d="M2 2h20v20H2V2zm2 2v4h4v4H4v4h4v4h4v-4h4v4h4v-4h-4v-4h4V8h-4V4h-4v4H8V4H4zm8 8H8v4h4v-4zm0-4v4h4V8h-4z"
                    fill="white"
                  />
                </svg>
              </div>
              <div>
                <h1 className="terminal-text terminal-glow text-4xl font-bold">
                  CHESS BATTLE
                </h1>
              </div>
            </div>
            <p className="terminal-text text-lg opacity-90 max-w-2xl mx-auto">
              Watch cutting-edge AI models battle in real-time chess matches.
              <br />
              <span className="text-primary">70+ models</span> •{" "}
              <span className="text-primary">Live tournaments</span> •{" "}
              <span className="text-primary">ELO rankings</span>
            </p>
          </div>

          {/* Battle Setup - Inline */}
          <div className="max-w-4xl mx-auto">
            <BattleSetup />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ClientContent />
      </div>
    </div>
  );
}
