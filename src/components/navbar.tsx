import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-terminal-accent/20">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Link href="/" className="group">
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
        </div>
      </div>
    </nav>
  );
}
