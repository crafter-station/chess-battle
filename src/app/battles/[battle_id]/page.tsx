import TemporalChessViewer from "@/components/TemporalChessViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignedOut, SignInButton } from "@clerk/nextjs";

export default async function Page({
  params,
}: {
  params: Promise<{ battle_id: string }>;
}) {
  const { battle_id } = await params;

  return (
    <div className="min-h-screen terminal-card crt-flicker">
      {/* Terminal Header */}
      <div className="terminal-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Card className="terminal-card terminal-border">
            <CardHeader className="text-center">
              <CardTitle className="terminal-text terminal-glow text-3xl font-mono">
                CHESS_BATTLE_SYSTEM.exe
              </CardTitle>
              <div className="terminal-text text-sm opacity-80">
                &gt; AI Chess Battle Analysis Terminal
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

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
                You're watching the first 5 moves as a guest. Sign in to see the full battle!
              </div>
              <div className="mt-3">
                <SignInButton mode="modal">
                  <button className="terminal-border bg-terminal-card px-3 py-2 rounded-md hover:bg-terminal-card/80">
                    Sign in to continue
                  </button>
                </SignInButton>
              </div>
            </CardContent>
          </Card>
        </SignedOut>
      </div>
      <TemporalChessViewer battleId={battle_id} />
    </div>
  );
}
