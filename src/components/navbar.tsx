import Link from "next/link";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="border-b border-terminal-border bg-black/40 backdrop-blur-sm flex-shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 terminal-text hover:text-primary transition-colors"
          >
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg
                width="12"
                height="12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="text-primary"
              >
                <title>Chess Icon</title>
                <path
                  d="M2 2h20v20H2V2zm2 2v4h4v4H4v4h4v4h4v-4h4v4h4v-4h-4v-4h4V8h-4V4h-4v4H8V4H4zm8 8H8v4h4v-4zm0-4v4h4V8h-4z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="font-mono text-sm terminal-glow">
              CHESS BATTLE
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="terminal-text text-xs hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/30"
          >
            HOME
          </Link>
          <Link
            href="/tournaments"
            className="terminal-text text-xs hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/30"
          >
            TOURNAMENTS
          </Link>
          <Link
            href="/leaderboard"
            className="terminal-text text-xs hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/30"
          >
            LEADERBOARD
          </Link>

          {/* Authentication Section */}
          <div className="flex items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="terminal-border bg-terminal-card px-3 py-1.5 rounded text-xs hover:bg-terminal-card/80 transition-colors terminal-text"
                >
                  SIGN IN
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 border border-primary/30 rounded",
                    userButtonPopoverCard:
                      "bg-black/90 border border-terminal-border backdrop-blur-sm",
                    userButtonPopoverActionButton:
                      "terminal-text hover:text-primary transition-colors",
                    userButtonPopoverActionButtonText:
                      "terminal-text font-mono text-xs",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>
        </nav>
      </div>
    </header>
  );
}
