import Link from "next/link";

import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
  };
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link href={`/tournaments/${tournament.id}`} className="group">
      <Card className="terminal-card terminal-border hover:border-primary/50 transition-all duration-200 h-full group-hover:shadow-lg group-hover:shadow-primary/10 overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50"></div>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-primary text-lg">🏆</span>
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
  );
}
