"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { AIModelsCollection } from "@/db/electric";
import { cn } from "@/lib/utils";

export function PlayerCard({
  color,
  modelId,
  isActive,
}: {
  color: "WHITE" | "BLACK";
  modelId: string | undefined;
  isActive: boolean;
}) {
  const { data } = useLiveQuery((q) =>
    q
      .from({
        model: AIModelsCollection,
      })
      .where(({ model }) => eq(model.canonical_id, modelId))
      .select(({ model }) => ({
        ...model,
      }))
  );

  if (!data || data.length === 0) {
    return modelId;
  }

  const model = data[0];

  return (
    <Card
      className={cn(
        "terminal-card terminal-border py-1 px-2",
        {
          "ring-2 ring-terminal-accent": isActive,
        }
      )}
    >
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              isActive ? "text-primary-foreground" : "text-secondary-foreground"
            )}
          >
            {color === "WHITE" ? "♔" : "♛"} {color}
          </Badge>

          {model?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            // biome-ignore lint/performance/noImgElement: necessary for provider logos
            <img
              src={model.logo_url}
              alt={model.name}
              className="h-8 w-8 rounded"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-terminal-border flex items-center justify-center text-sm opacity-70">
              🧠
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="terminal-text font-mono text-sm font-semibold truncate">
              {model.name ?? model.canonical_id}
            </div>
            {model.provider && (
              <div className="terminal-text text-xs opacity-70 capitalize">
                {model.provider}
              </div>
            )}
            {model?.description && (
              <div className="terminal-text text-xs opacity-60 line-clamp-2 mt-1">
                {model.description}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
