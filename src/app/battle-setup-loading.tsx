import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BattleSetupLoading() {
  return (
    <Card className="terminal-card terminal-border gap-0">
      <CardHeader className="pb-4">
        <CardTitle className="terminal-text terminal-glow text-lg font-mono text-center">
          ⚔️ CHOOSE YOUR MODELS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Selection Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* White Model Loading */}
          <div className="space-y-2">
            <div className="terminal-text text-sm font-mono">♔ WHITE</div>
            <div className="terminal-card terminal-border p-3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>

          {/* Black Model Loading */}
          <div className="space-y-2">
            <div className="terminal-text text-sm font-mono">♛ BLACK</div>
            <div className="terminal-card terminal-border p-3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>

        {/* Engine Mode Section */}
        <div className="flex items-center justify-between text-xs">
          <span className="terminal-text font-mono">Engine Mode:</span>
          <div className="flex gap-3">
            <div className="inline-flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <span className="terminal-text text-xs">JSON</span>
            </div>
            <div className="inline-flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <span className="terminal-text text-xs">Streaming</span>
            </div>
          </div>
        </div>

        {/* Start Battle Button */}
        <Button disabled className="w-full terminal-button h-12" size="lg">
          <span className="animate-pulse">⚡ LOADING...</span>
        </Button>
      </CardContent>
    </Card>
  );
}
