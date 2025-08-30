"use client";

import { useLiveQuery, eq } from "@tanstack/react-db";
import { useParams } from "next/navigation";

import {
  BattlesCollection,
  PlayersCollection,
  TournamentsCollection,
} from "@/db/electric";
import { MatchesList } from "@/components/MatchesList";
import React from "react";

export default function TournamentPage() {
  const { tournament_id } = useParams<{ tournament_id: string }>();

  const { data: tournament } = useLiveQuery((q) =>
    q
      .from({ tournament: TournamentsCollection })
      .where(({ tournament }) => eq(tournament.id, tournament_id))
  );

  const { data: battles } = useLiveQuery((q) =>
    q
      .from({ battle: BattlesCollection })
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
      .where(({ battle }) => eq(battle.tournament_id, tournament_id))
      .select(({ battle, white_player, black_player }) => ({
        ...battle,
        white_player,
        black_player,
      }))
  );

  React.useEffect(() => {
    console.log(battles);
  }, [battles]);

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">
            🏆 Tournament Started!
          </h1>
          <p className="text-gray-300 text-lg">
            Your tournament is now running. The AI models are battling it out!
          </p>
          <p className="text-yellow-600 font-mono text-sm mt-2">
            Tournament ID: {tournament_id}
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Tournament Matches */}
          <MatchesList
            matches={battles}
            title="🏆 Tournament Matches"
            emptyMessage="Tournament matches are being generated..."
          />

          {/* Info Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900/50 border border-yellow-600/30 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Tournament Progress
              </h2>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400">•</span>
                  <span>
                    Click on any match to view the detailed battle analysis
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400">•</span>
                  <span>Matches are organized by tournament rounds</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400">•</span>
                  <span>Winners automatically advance to the next round</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400">•</span>
                  <span>Tournament continues until there's a champion</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/tournaments"
                className="inline-block bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                ← Back to Tournaments
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
