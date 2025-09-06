import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { TournamentSkeleton } from "./loading-skeletons";
import { TournamentCard } from "./tournament-card";

interface TournamentsSection {
  tournaments?: Array<{
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
  }> | null;
  tournamentsEmptyReady: boolean;
}

export function TournamentsSection({
  tournaments,
  tournamentsEmptyReady,
}: TournamentsSection) {
  const [tournamentSearchTerm, setTournamentSearchTerm] = useState("");

  const filteredTournaments =
    tournaments?.filter(
      (tournament) =>
        tournament.name
          .toLowerCase()
          .includes(tournamentSearchTerm.toLowerCase()) ||
        tournament.description
          ?.toLowerCase()
          .includes(tournamentSearchTerm.toLowerCase()),
    ) || [];

  return (
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
              {filteredTournaments.length} found
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {tournaments === undefined ? (
          <TournamentSkeleton keyPrefix="tournament-skel-inline" />
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
            <TournamentSkeleton keyPrefix="tournament-skel-inline-wait" />
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
