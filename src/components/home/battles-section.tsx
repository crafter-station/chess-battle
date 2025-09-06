import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BattleCard } from "./battle-card";
import { BattleSkeleton } from "./loading-skeletons";

interface BattlesSectionProps {
  battles?: Array<{
    id: string;
    tournament_id?: string | null;
    created_at: string;
    white_player?: {
      model_id: string;
    } | null;
    black_player?: {
      model_id: string;
    } | null;
  }> | null;
  battlesEmptyReady: boolean;
  allModels?: Array<{
    canonical_id: string;
    name?: string | null;
    logo_url?: string | null;
  }> | null;
}

export function BattlesSection({
  battles,
  battlesEmptyReady,
  allModels,
}: BattlesSectionProps) {
  const [battleSearchTerm, setBattleSearchTerm] = useState("");
  const [battlesDisplayCount, setBattlesDisplayCount] = useState(10);
  const [battleFilter, setBattleFilter] = useState("recent");

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

  return (
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
          <BattleSkeleton keyPrefix="battle-skel-inline" />
        ) : !battles || battles.length === 0 ? (
          battlesEmptyReady ? (
            <div className="terminal-text text-center py-8 opacity-60">
              &gt; No battles found. Create your first AI chess battle above.
            </div>
          ) : (
            <BattleSkeleton keyPrefix="battle-skel-inline-wait" />
          )
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBattles.slice(0, battlesDisplayCount).map((battle) => (
                <BattleCard
                  key={battle.id}
                  battle={battle}
                  allModels={allModels}
                />
              ))}
            </div>

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
                    onClick={() => setBattlesDisplayCount((prev) => prev + 10)}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
