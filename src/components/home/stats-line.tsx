import { Skeleton } from "@/components/ui/skeleton";

interface StatsLineProps {
  tournaments?: Array<{ id: string }>;
  battles?: Array<{ id: string }>;
}

export function StatsLine({ tournaments, battles }: StatsLineProps) {
  return (
    <div className="terminal-text text-center text-sm opacity-70 flex items-center justify-center gap-6">
      <span>
        🧠 <span className="text-primary font-mono">70+</span> AI Models
      </span>
      <span>•</span>
      <span>
        🏆{" "}
        {tournaments === undefined ? (
          <Skeleton className="inline-block h-4 w-6" />
        ) : (
          <span className="text-primary font-mono">
            {tournaments?.length || 0}
          </span>
        )}{" "}
        Active Tournaments
      </span>
      <span>•</span>
      <span>
        ⚔️{" "}
        {battles === undefined ? (
          <Skeleton className="inline-block h-4 w-8" />
        ) : (
          <span className="text-primary font-mono">{battles?.length || 0}</span>
        )}{" "}
        Total Battles
      </span>
    </div>
  );
}
