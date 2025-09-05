"use client";

import dynamic from "next/dynamic";

import { SignedOut, SignInButton } from "@clerk/nextjs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TemporalChessViewer = dynamic(
  () =>
    import("@/components/temporal-chess-viewer").then((mod) => ({
      default: mod.TemporalChessViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 terminal-card rounded-lg">
        <div className="terminal-text text-lg terminal-glow">
          Loading chess viewer...
        </div>
      </div>
    ),
  },
);

export default function Page() {
  return (
    <div className="min-h-screen bg-background crt-flicker">
      {/* Temporal Viewer */}
      <div className="max-w-4xl mx-auto px-6">
        <SignedOut>
          <Card className="mb-4 terminal-card terminal-border bg-yellow-950/30 border-yellow-700/40">
            <CardHeader>
              <CardTitle className="terminal-text terminal-glow text-lg font-mono">
                ⚠️ Limited preview for guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="terminal-text text-sm opacity-90">
                You're watching the first 5 moves as a guest. Sign in to see the
                full battle!
              </div>
              <div className="mt-3">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="terminal-border bg-terminal-card px-3 py-2 rounded-md hover:bg-terminal-card/80"
                  >
                    Sign in to continue
                  </button>
                </SignInButton>
              </div>
            </CardContent>
          </Card>
        </SignedOut>
      </div>
      <TemporalChessViewer />
    </div>
  );
}
