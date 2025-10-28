"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

// Dynamically import the client component to prevent SSR issues
const TournamentPageClient = dynamic(
  () =>
    import("@/components/tournament-page-client").then((mod) => ({
      default: mod.TournamentPageClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[calc(100vh-52px)] bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="terminal-card terminal-border p-8 text-center">
            <div className="terminal-text text-lg">
              &gt; Initializing tournament view...
            </div>
          </div>
        </div>
      </div>
    ),
  },
);

export default function TournamentPage() {
  const { tournament_id } = useParams<{ tournament_id: string }>();

  return <TournamentPageClient tournamentId={tournament_id} />;
}
