"use client";

import { useState } from "react";
import TemporalChessViewer from "@/components/TemporalChessViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Page() {
  const [battleId, setBattleId] = useState("g739vc4e7j");
  const [inputValue, setInputValue] = useState("g739vc4e7j");

  const handleLoadBattle = () => {
    setBattleId(inputValue);
  };

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

      {/* Battle ID Input Terminal */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <Card className="terminal-card terminal-border">
          <CardHeader>
            <CardTitle className="terminal-text text-sm font-mono">BATTLE_ID_INPUT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="battleId" className="terminal-text text-xs font-mono">
                ENTER_BATTLE_ID:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="battleId"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="battle_id_here"
                  className="terminal-input terminal-text font-mono flex-1"
                />
                <Button
                  type="button"
                  onClick={handleLoadBattle}
                  className="terminal-button terminal-text font-mono"
                >
                  LOAD_BATTLE
                </Button>
              </div>
            </div>
            <div className="terminal-text text-xs opacity-60">
              Current Battle: {battleId.slice(0, 12)}...
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temporal Viewer */}
      <TemporalChessViewer battleId={battleId} />
    </div>
  );
}
