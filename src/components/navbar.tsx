"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

export function Navbar() {
  return (
    <div className="terminal-border sticky top-0 z-50 bg-black/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <Card className="terminal-card terminal-border">
          <CardContent className="p-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="terminal-text terminal-glow text-xl font-mono group-hover:text-terminal-accent transition-colors">
                  CHESS_BATTLE_SYSTEM.exe
                </span>
              </Link>

              <div className="flex items-center space-x-6">
                <Link
                  href="/"
                  className="terminal-text hover:text-terminal-accent transition-colors font-mono text-sm"
                >
                  &gt; HOME
                </Link>
                <Link
                  href="/tournaments"
                  className="terminal-text hover:text-terminal-accent transition-colors font-mono text-sm"
                >
                  &gt; CREATE_TOURNAMENT
                </Link>
              </div>
            </nav>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
