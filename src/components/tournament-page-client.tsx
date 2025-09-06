"use client";

import Link from "next/link";
import React from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";

import { BattlesCollection, TournamentsCollection } from "@/db/electric";

import { MatchesList } from "@/components/tournament-matches-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TournamentPageClientProps {
  tournamentId: string;
}

export function TournamentPageClient({
  tournamentId,
}: TournamentPageClientProps) {
  const [mounted, setMounted] = React.useState(false);

  // Ensure component is mounted on client side
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: tournament, isLoading: tournamentLoading } = useLiveQuery(
    (q) =>
      q
        .from({ tournament: TournamentsCollection })
        .where(({ tournament }) => eq(tournament.id, tournamentId)),
    [tournamentId],
  );

  const { data: battles } = useLiveQuery(
    (q) =>
      q
        .from({ battle: BattlesCollection })
        .where(({ battle }) => eq(battle.tournament_id, tournamentId))
        .select(({ battle }) => ({ ...battle })),
    [tournamentId],
  );

  // Show loading state until mounted and data loaded
  if (!mounted || tournamentLoading) {
    return (
      <div className="min-h-[calc(100vh-52px)] bg-background crt-flicker">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Card className="terminal-card terminal-border">
            <CardContent className="p-8 text-center">
              <div className="terminal-text text-lg">
                &gt; Loading tournament data...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tournament || tournament.length === 0) {
    return (
      <div className="min-h-[calc(100vh-52px)] bg-background crt-flicker">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Card className="terminal-card terminal-border">
            <CardContent className="p-8 text-center">
              <div className="terminal-text text-lg">
                &gt; Tournament not found
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-background crt-flicker">
      {/* Tournament Header */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card className="terminal-card terminal-border">
          <CardHeader className="text-center">
            <CardTitle className="terminal-text terminal-glow text-3xl font-mono mb-4">
              🏆 {tournament[0]?.name || "Tournament"}
            </CardTitle>
            <div className="terminal-text text-lg opacity-80">
              Your tournament is now running. The AI models are battling it out!
            </div>
            <div className="terminal-text font-mono text-sm mt-2 opacity-60">
              Tournament ID: {tournamentId}
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* Tournament Matches */}
        <MatchesList
          matches={battles}
          title="🏆 Tournament Matches"
          emptyMessage="Tournament matches are being generated..."
        />

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="terminal-card terminal-border">
            <CardHeader>
              <CardTitle className="terminal-text terminal-glow text-xl font-mono">
                &gt; Tournament Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 terminal-text">
                <div className="flex items-start gap-3">
                  <span className="text-terminal-accent">•</span>
                  <span>
                    Click on any match to view the detailed battle analysis
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-terminal-accent">•</span>
                  <span>Matches are organized by tournament rounds</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-terminal-accent">•</span>
                  <span>Winners automatically advance to the next round</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-terminal-accent">•</span>
                  <span>Tournament continues until there's a champion</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card terminal-border">
            <CardHeader>
              <CardTitle className="terminal-text terminal-glow text-xl font-mono">
                &gt; Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/">
                <Button
                  className="w-full terminal-text font-mono border-terminal-accent text-terminal-accent hover:bg-terminal-accent/10"
                  variant="outline"
                >
                  ← Back to Home
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button
                  className="w-full terminal-text font-mono border-terminal-accent text-terminal-accent hover:bg-terminal-accent/10"
                  variant="outline"
                >
                  ← Back to Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
