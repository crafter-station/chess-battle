import Link from "next/link";

import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { ModelIcon } from "./model-icon";

interface BattleCardProps {
  battle: {
    id: string;
    tournament_id?: string | null;
    created_at: string;
    white_player?: {
      model_id: string;
    } | null;
    black_player?: {
      model_id: string;
    } | null;
  };
  allModels?: Array<{
    canonical_id: string;
    name?: string | null;
    logo_url?: string | null;
  }> | null;
}

export function BattleCard({ battle, allModels }: BattleCardProps) {
  return (
    <Link
      key={battle.id}
      href={`/battles/${battle.id}`}
      className="group block"
    >
      <Card className="terminal-card terminal-border hover:border-terminal-accent/60 hover:shadow-lg hover:shadow-terminal-accent/10 transition-all duration-300 group-hover:scale-[1.02] h-full overflow-hidden">
        <div className="relative">
          {battle.tournament_id && (
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/60 to-accent/60"></div>
          )}
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header with Battle ID and Tournament Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-xs font-mono bg-primary/20 border-primary/30"
                  >
                    #{battle.id.slice(0, 8)}
                  </Badge>
                  {battle.tournament_id && (
                    <Badge
                      variant="outline"
                      className="terminal-text text-xs border-primary/40 text-primary bg-primary/10"
                    >
                      🏆 TOURNAMENT
                    </Badge>
                  )}
                </div>
                <div className="terminal-text text-xs opacity-50 font-mono">
                  {formatDate(battle.created_at)}
                </div>
              </div>

              {/* Battle Matchup - More Prominent */}
              <div className="space-y-3">
                {/* White Player */}
                <div className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 flex-1">
                    <ModelIcon
                      modelId={battle.white_player?.model_id}
                      allModels={allModels}
                      isWhite={true}
                    />
                    <div className="flex-1">
                      <div className="text-xs text-white/60 font-mono">
                        ♔ WHITE
                      </div>
                      <div className="terminal-text font-mono text-sm font-medium truncate">
                        {allModels?.find(
                          (m) =>
                            m.canonical_id === battle.white_player?.model_id,
                        )?.name ||
                          battle.white_player?.model_id?.replace(
                            /^(gpt-|claude-|gemini-|anthropic\/|openai\/)/,
                            "",
                          ) ||
                          "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-terminal-accent/20 border border-terminal-accent/30">
                    <span className="terminal-text text-terminal-accent font-bold text-sm">
                      ⚔️ VS
                    </span>
                  </div>
                </div>

                {/* Black Player */}
                <div className="flex items-center gap-3 p-2 rounded-md bg-gray-800/30 border border-gray-600/20">
                  <div className="flex items-center gap-2 flex-1">
                    <ModelIcon
                      modelId={battle.black_player?.model_id}
                      allModels={allModels}
                      isWhite={false}
                    />
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 font-mono">
                        ♛ BLACK
                      </div>
                      <div className="terminal-text font-mono text-sm font-medium truncate">
                        {allModels?.find(
                          (m) =>
                            m.canonical_id === battle.black_player?.model_id,
                        )?.name ||
                          battle.black_player?.model_id?.replace(
                            /^(gpt-|claude-|gemini-|anthropic\/|openai\/)/,
                            "",
                          ) ||
                          "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-terminal-accent/20">
                <div className="flex items-center gap-2">
                  {battle.tournament_id && (
                    <Link
                      href={`/tournaments/${battle.tournament_id}`}
                      className="terminal-text text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      title="View Tournament"
                    >
                      🏆 Tournament
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1 text-terminal-accent opacity-70 group-hover:opacity-100 transition-all">
                  <span className="text-sm font-medium">Watch</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
