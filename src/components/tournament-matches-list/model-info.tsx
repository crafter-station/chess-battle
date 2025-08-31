"use client";

import Image from "next/image";

import { eq, useLiveQuery } from "@tanstack/react-db";

import { AIModelsCollection } from "@/db/electric";

import { Badge } from "@/components/ui/badge";

interface ModelInfoProps {
  modelId: string;
  className?: string;
}

export function ModelInfo({ modelId, className = "" }: ModelInfoProps) {
  const { data: model } = useLiveQuery((q) =>
    q
      .from({ model: AIModelsCollection })
      .where(({ model }) => eq(model.canonical_id, modelId))
      .select(({ model }) => ({ ...model })),
  );

  const modelData = model?.[0];

  if (!modelData) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="terminal-text font-mono truncate">{modelId}</div>
        <div className="terminal-text text-xs opacity-60">Unknown Model</div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        {modelData.logo_url && (
          <Image
            src={modelData.logo_url}
            alt={`${modelData.provider} logo`}
            width={16}
            height={16}
            className="rounded"
          />
        )}
        <div className="terminal-text text-sm font-mono truncate">
          {modelData.name}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs terminal-text">
          {modelData.provider}
        </Badge>
      </div>

      {modelData.description && (
        <div className="terminal-text text-xs opacity-70 line-clamp-2">
          {modelData.description}
        </div>
      )}
    </div>
  );
}
