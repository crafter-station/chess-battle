"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useEffect, useState } from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";

import {
  AIModelsCollection,
  BattlesCollection,
  PlayersCollection,
  TournamentsCollection,
} from "@/db/electric";

import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Stable ugly keys for skeleton elements to satisfy lint rules
const SKELETON_TOURNAMENT_KEYS = ["t1", "t2", "t3", "t4", "t5", "t6"];
const SKELETON_BATTLE_KEYS = ["b1", "b2", "b3", "b4", "b5"];

// Provider logos map (company before the slash)
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
  isWhite = true,
}: {
  modelId?: string | null;
  allModels?: Array<{
    canonical_id: string;
    name?: string | null;
    logo_url?: string | null;
  }> | null;
  isWhite?: boolean;
}) {
  const model = allModels?.find((m) => m.canonical_id === modelId);

  // Use model's logo_url first (same as ModelSelect)
  if (model?.logo_url) {
    return (
      <Image
        src={model.logo_url}
        alt={model.name || model.canonical_id}
        width={24}
        height={24}
        className="w-6 h-6 rounded shrink-0 object-cover"
        onError={(e) => {
          console.log(`❌ Logo failed for "${modelId}": ${model.logo_url}`);
          // Hide the broken image
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
        width={24}
        height={24}
        className="w-6 h-6 rounded shrink-0 object-cover"
        onError={(e) => {
          console.log(
            `❌ Provider logo failed for "${modelId}": ${providerLogo}`,
          );
          // Hide the broken image
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Final fallback to chess pieces
  return (
    <div
      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
        isWhite
          ? "bg-white/10 border-white/20"
          : "bg-gray-800/40 border-gray-600/20"
      }`}
    >
      <span className="text-sm">{isWhite ? "♔" : "♛"}</span>
    </div>
  );
}

// Client-only content component - dynamically imported to avoid SSR
function ClientContentInternal() {
  // Debounced empty state flags to avoid flash of "not found data" while data hydrates
  const [tournamentsEmptyReady, setTournamentsEmptyReady] = useState(false);
  const [battlesEmptyReady, setBattlesEmptyReady] = useState(false);

  // Search and pagination states
  const [battleSearchTerm, setBattleSearchTerm] = useState("");
  const [tournamentSearchTerm, setTournamentSearchTerm] = useState("");
  const [battlesDisplayCount, setBattlesDisplayCount] = useState(10);
  const [battleFilter, setBattleFilter] = useState("recent");

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

  // Minimal fallback (we rely on provider logos now)
  const _fallbackModels = React.useMemo(() => [], []);

  // Use database models when available, fallback is empty array which is fine
  const modelsToUse = allModels && allModels.length > 0 ? allModels : [];

  // Debug logs
  React.useEffect(() => {
    console.log("🗄️ DB Models count:", allModels?.length || 0);
    console.log("🔍 Raw models data:", allModels?.slice(0, 2));
    console.log(
      "📋 Models in use:",
      modelsToUse
        .slice(0, 3)
        ?.map((m) => `"${m.canonical_id}" (logo: ${!!m.logo_url})`),
    );
    if (battles && battles.length > 0) {
      console.log("🤍 White model_id:", battles[0]?.white_player?.model_id);
      console.log("🖤 Black model_id:", battles[0]?.black_player?.model_id);
      // Try to find the models
      const whiteModel = allModels?.find(
        (m) => m.canonical_id === battles[0]?.white_player?.model_id,
      );
      const blackModel = allModels?.find(
        (m) => m.canonical_id === battles[0]?.black_player?.model_id,
      );
      console.log("🔍 White model found:", whiteModel);
      console.log("🔍 Black model found:", blackModel);
    }
  }, [allModels, modelsToUse, battles]);

  const { data: tournaments } = useLiveQuery((q) =>
    q
      .from({ tournament: TournamentsCollection })
      .orderBy(({ tournament }) => tournament.created_at, "desc"),
  );

  // Filter battles based on search term and filter type
  const filteredBattles =
    battles?.filter((battle) => {
      const matchesSearch =
        !battleSearchTerm ||
        battle.white_player?.model_id
          .toLowerCase()
          .includes(battleSearchTerm.toLowerCase()) ||
        battle.black_player?.model_id
          .toLowerCase()
          .includes(battleSearchTerm.toLowerCase());

      const matchesFilter =
        battleFilter === "all" ||
        (battleFilter === "tournament" && battle.tournament_id) ||
        (battleFilter === "recent" && !battle.tournament_id);

      return matchesSearch && matchesFilter;
    }) || [];

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
      {/* Simple Stats Line */}
      <div className="terminal-text text-center text-sm opacity-70 flex items-center justify-center gap-6">
        <span>
          🧠 <span className="text-primary font-mono">70+</span> AI Models
        </span>
        <span>•</span>
        <span>
          🏆{" "}
          <span className="text-primary font-mono">
            {tournaments?.length || 0}
          </span>{" "}
          Active Tournaments
        </span>
        <span>•</span>
        <span>
          ⚔️{" "}
          <span className="text-primary font-mono">{battles?.length || 0}</span>{" "}
          Total Battles
        </span>
      </div>

      {/* Enhanced Tournaments Section */}
      <Card className="terminal-card terminal-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="terminal-text terminal-glow text-lg font-mono flex items-center gap-2">
              <span className="text-primary">🏆</span>
              TOURNAMENTS
            </CardTitle>
            <Link
              href="/tournaments"
              className="flex items-center gap-2 terminal-text text-xs hover:text-primary transition-colors px-3 py-1.5 border border-primary/30 rounded-md hover:bg-primary/10 group"
            >
              <span className="group-hover:scale-110 transition-transform">
                ⚡
              </span>
              Create
            </Link>
          </div>
          {tournaments && tournaments.length > 0 && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search tournaments..."
                value={tournamentSearchTerm}
                onChange={(e) => setTournamentSearchTerm(e.target.value)}
                className="terminal-input text-sm"
              />
              <Badge variant="secondary" className="text-xs">
                {
                  tournaments.filter(
                    (t) =>
                      t.name
                        .toLowerCase()
                        .includes(tournamentSearchTerm.toLowerCase()) ||
                      t.description
                        ?.toLowerCase()
                        .includes(tournamentSearchTerm.toLowerCase()),
                  ).length
                }{" "}
                found
              </Badge>
            </div>
          )}
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
              {tournaments
                .filter(
                  (tournament) =>
                    tournament.name
                      .toLowerCase()
                      .includes(tournamentSearchTerm.toLowerCase()) ||
                    tournament.description
                      ?.toLowerCase()
                      .includes(tournamentSearchTerm.toLowerCase()),
                )
                .map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
                    className="group"
                  >
                    <Card className="terminal-card terminal-border hover:border-primary/50 transition-all duration-200 h-full group-hover:shadow-lg group-hover:shadow-primary/10 overflow-hidden">
                      <div className="relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50"></div>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <span className="text-primary text-lg">
                                      🏆
                                    </span>
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                                <div>
                                  <Badge
                                    variant="outline"
                                    className="terminal-text text-xs border-primary/30 mb-1"
                                  >
                                    ACTIVE
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="terminal-text text-xs opacity-50 font-mono">
                                  #{tournament.id.slice(-6)}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="terminal-text font-mono text-base font-medium group-hover:text-primary transition-colors line-clamp-1">
                                {tournament.name}
                              </div>
                              {tournament.description && (
                                <div className="terminal-text text-sm opacity-70 line-clamp-2">
                                  {tournament.description}
                                </div>
                              )}
                            </div>

                            <Separator className="bg-primary/10" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="terminal-text text-xs opacity-70">
                                  {formatDate(tournament.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-sm">Enter</span>
                                <span>→</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Recent Battles Section */}
      <Card className="terminal-card terminal-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="terminal-text terminal-glow text-lg font-mono flex items-center gap-2">
              <span className="text-accent">⚔️</span>
              RECENT BATTLES
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {battles?.length || 0} Total Games
            </Badge>
          </div>
          {battles && battles.length > 0 && (
            <div className="space-y-3">
              <Input
                placeholder="Search battles by model name..."
                value={battleSearchTerm}
                onChange={(e) => setBattleSearchTerm(e.target.value)}
                className="terminal-input text-sm"
              />
              <Tabs
                value={battleFilter}
                onValueChange={setBattleFilter}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="recent" className="text-xs">
                    Recent ({battles.filter((b) => !b.tournament_id).length})
                  </TabsTrigger>
                  <TabsTrigger value="tournament" className="text-xs">
                    Tournament ({battles.filter((b) => b.tournament_id).length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">
                    All ({battles.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {filteredBattles.length !== battles.length && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredBattles.length} of {battles.length} battles
                  </Badge>
                  {(battleSearchTerm || battleFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => {
                        setBattleSearchTerm("");
                        setBattleFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
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
              {filteredBattles.slice(0, battlesDisplayCount).map((battle) => (
                <Card
                  key={battle.id}
                  className="terminal-card terminal-border hover:border-terminal-accent/50 transition-all duration-200 group overflow-hidden"
                >
                  <div className="relative">
                    {battle.tournament_id && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50"></div>
                    )}
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Battle ID and Tournament Badge */}
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="secondary"
                            className="text-xs font-mono shrink-0"
                          >
                            #{battle.id.slice(0, 6)}
                          </Badge>
                          {battle.tournament_id && (
                            <Badge
                              variant="outline"
                              className="terminal-text text-xs border-primary/30 shrink-0"
                            >
                              🏆
                            </Badge>
                          )}
                        </div>

                        {/* Center: Players */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* White Player */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ModelIcon
                              modelId={battle.white_player?.model_id}
                              allModels={modelsToUse}
                              isWhite={true}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="terminal-text font-mono text-sm font-medium truncate">
                                {modelsToUse?.find(
                                  (m) =>
                                    m.canonical_id ===
                                    battle.white_player?.model_id,
                                )?.name ||
                                  battle.white_player?.model_id?.replace(
                                    /^(gpt-|claude-|gemini-|anthropic\/|openai\/)/,
                                    "",
                                  ) ||
                                  "Unknown"}
                              </div>
                            </div>
                          </div>

                          {/* VS */}
                          <div className="terminal-text text-terminal-accent font-bold text-sm shrink-0">
                            VS
                          </div>

                          {/* Black Player */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <div className="min-w-0 flex-1 text-right">
                              <div className="terminal-text font-mono text-sm font-medium truncate">
                                {modelsToUse?.find(
                                  (m) =>
                                    m.canonical_id ===
                                    battle.black_player?.model_id,
                                )?.name ||
                                  battle.black_player?.model_id?.replace(
                                    /^(gpt-|claude-|gemini-|anthropic\/|openai\/)/,
                                    "",
                                  ) ||
                                  "Unknown"}
                              </div>
                            </div>
                            <ModelIcon
                              modelId={battle.black_player?.model_id}
                              allModels={modelsToUse}
                              isWhite={false}
                            />
                          </div>
                        </div>

                        {/* Right: Date and Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="terminal-text text-xs opacity-50 hidden sm:block">
                            {formatDate(battle.created_at)}
                          </div>
                          <div className="flex items-center gap-2">
                            {battle.tournament_id && (
                              <Link
                                href={`/tournaments/${battle.tournament_id}`}
                                className="terminal-text text-xs text-primary hover:text-primary/80 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="View Tournament"
                              >
                                🏆
                              </Link>
                            )}
                            <Link
                              href={`/battles/${battle.id}`}
                              className="terminal-text text-xs text-terminal-accent hover:text-terminal-accent/80 transition-all flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Watch →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}

              {/* Pagination Controls */}
              {filteredBattles.length > battlesDisplayCount && (
                <div className="flex items-center justify-center pt-6">
                  <div className="flex items-center gap-4">
                    <div className="terminal-text text-sm opacity-70">
                      Showing {battlesDisplayCount} of {filteredBattles.length}{" "}
                      battles
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setBattlesDisplayCount((prev) => prev + 10)
                      }
                      className="terminal-text text-xs hover:text-primary transition-colors"
                    >
                      Load More
                    </Button>
                    {battlesDisplayCount > 10 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBattlesDisplayCount(10)}
                        className="terminal-text text-xs opacity-60 hover:opacity-100"
                      >
                        Show Less
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
