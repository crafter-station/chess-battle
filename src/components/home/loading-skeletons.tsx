import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_TOURNAMENT_KEYS = ["t1", "t2", "t3", "t4", "t5", "t6"];
const SKELETON_BATTLE_KEYS = ["b1", "b2", "b3", "b4", "b5"];

export function TournamentSkeleton({ keyPrefix }: { keyPrefix: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {SKELETON_TOURNAMENT_KEYS.map((key) => (
        <Card
          key={`${keyPrefix}-${key}`}
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
  );
}

export function BattleSkeleton({ keyPrefix }: { keyPrefix: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {SKELETON_BATTLE_KEYS.map((key) => (
        <Card
          key={`${keyPrefix}-${key}`}
          className="terminal-card terminal-border h-full"
        >
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>

              {/* Players skeleton */}
              <div className="space-y-3">
                {/* White player */}
                <div className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/10">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                {/* VS */}
                <div className="flex justify-center">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                {/* Black player */}
                <div className="flex items-center gap-3 p-2 rounded-md bg-gray-800/30 border border-gray-600/20">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>

              {/* Footer skeleton */}
              <div className="flex items-center justify-between pt-2 border-t border-terminal-accent/20">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
