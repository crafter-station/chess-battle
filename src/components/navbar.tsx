import Link from "next/link";

import { UserButton } from "@clerk/nextjs";

import { CreditsButton } from "./credits-button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-terminal-accent/20">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <svg
              width="20"
              height="20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="text-foreground"
            >
              <title>Chess Battle Logo</title>
              <path
                d="M2 2h20v20H2V2zm2 2v4h4v4H4v4h4v4h4v-4h4v4h4v-4h-4v-4h4V8h-4V4h-4v4H8V4H4zm8 8H8v4h4v-4zm0-4v4h4V8h-4z"
                fill="currentColor"
              />
            </svg>
            <span className="terminal-text terminal-glow text-lg font-mono group-hover:text-terminal-accent transition-colors">
              CHESS_BATTLE
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="terminal-text hover:text-terminal-accent transition-colors font-mono text-xs"
            >
              HOME
            </Link>
            <Link
              href="/tournaments"
              className="terminal-text hover:text-terminal-accent transition-colors font-mono text-xs"
            >
              TOURNAMENT
            </Link>
            <Link
              href="/leaderboard"
              className="terminal-text hover:text-terminal-accent transition-colors font-mono text-xs"
            >
              LEADERBOARD
            </Link>
          </div>
          <UserButton />
          <CreditsButton />
        </div>
      </div>
    </nav>
  );
}
