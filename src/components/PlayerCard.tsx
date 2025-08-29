"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ModelInfo = {
  canonical_id: string;
  name: string | null;
  description: string | null;
  logo_url: string | null;
  provider: string | null;
};

export function PlayerCard({
  color,
  modelId,
  isActive,
}: {
  color: "WHITE" | "BLACK";
  modelId: string | undefined;
  isActive: boolean;
}) {
  const [modelInfo, setModelInfo] = React.useState<ModelInfo | null>(null);

  React.useEffect(() => {
    if (!modelId) return;
    
    // Fetch model info from our API
    fetch("/api/shapes/models")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const models = (data?.models ?? []) as ModelInfo[];
        const found = models.find((m) => m.canonical_id === modelId);
        setModelInfo(found || null);
      })
      .catch(() => setModelInfo(null));
  }, [modelId]);

  const displayName = modelInfo?.name || modelId || "Unknown Model";
  const provider = modelInfo?.provider || modelId?.split("/")[0] || "";

  return (
    <Card className={`terminal-card terminal-border ${isActive ? "ring-2 ring-terminal-accent" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="terminal-text"
          >
            {color === "WHITE" ? "♔" : "♛"} {color}
          </Badge>
          
          {modelInfo?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={modelInfo.logo_url} 
              alt={displayName} 
              className="h-8 w-8 rounded"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-terminal-border flex items-center justify-center text-sm opacity-70">
              🧠
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="terminal-text font-mono text-sm font-semibold truncate">
              {displayName}
            </div>
            {provider && (
              <div className="terminal-text text-xs opacity-70 capitalize">
                {provider}
              </div>
            )}
            {modelInfo?.description && (
              <div className="terminal-text text-xs opacity-60 line-clamp-2 mt-1">
                {modelInfo.description}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
