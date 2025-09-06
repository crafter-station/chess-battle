"use client";

import dynamic from "next/dynamic";

import { SignedOut, SignInButton } from "@clerk/nextjs";

const TemporalChessViewer = dynamic(
  () =>
    import("@/components/temporal-chess-viewer").then((mod) => ({
      default: mod.TemporalChessViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-background crt-flicker flex items-center justify-center">
        <div className="terminal-text text-lg terminal-glow">
          Loading chess viewer...
        </div>
      </div>
    ),
  },
);

export default function Page() {
  return (
    <div className="h-[calc(100vh-52px)] lg:h-[calc(100vh-52px)] bg-background crt-flicker flex flex-col overflow-hidden">
      {/* Guest Warning Banner */}
      <SignedOut>
        <div className="border-b border-yellow-700/30 bg-yellow-950/20 p-3 flex-shrink-0">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="terminal-text text-xs opacity-90">
                Limited preview - Sign in to see full battle
              </span>
            </div>
            <SignInButton mode="modal">
              <button
                type="button"
                className="terminal-border bg-terminal-card px-3 py-1.5 rounded text-xs hover:bg-terminal-card/80 transition-colors terminal-text"
              >
                Sign in
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      {/* Main Battle Content */}
      <div className="flex-1 overflow-hidden">
        <TemporalChessViewer />
      </div>
    </div>
  );
}
