import TemporalChessViewer from "@/components/TemporalChessViewer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
      <TemporalChessViewer battleId={battle_id} />
    </div>
  );
}
