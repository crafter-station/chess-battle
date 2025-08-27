"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import * as React from "react";
import { StartBattleAction } from "@/actions/start-battle.action";
import { MODELS } from "@/lib/models";
import { Button } from "@/components/ui/button";

export default function BattleSetup() {
  const router = useRouter();
  const [whiteModel, setWhiteModel] = React.useState<string>("");
  const [blackModel, setBlackModel] = React.useState<string>("");

  const [state, action, isPending] = React.useActionState(StartBattleAction, {
    input: {},
    output: {
      success: false,
      error: "",
    },
  });

  React.useEffect(() => {
    if (state.output.success && "data" in state.output) {
      router.push(`/battles/${state.output.data.battleId}`);
    }
  }, [state.output.success, router, state.output]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Card className="terminal-card terminal-border">
        <CardHeader>
          <CardTitle className="terminal-text terminal-glow text-xl font-mono">
            ⚔️ CONFIGURE BATTLE
          </CardTitle>
          <div className="terminal-text text-sm opacity-80">
            &gt; Select two AI models to battle in chess
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* White Player Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="white-model"
              className="terminal-text font-mono text-sm"
            >
              ♔ WHITE PLAYER MODEL
            </Label>
            <select
              value={whiteModel}
              onChange={(e) => setWhiteModel(e.target.value)}
              className="w-full terminal-border bg-terminal-card terminal-text px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-terminal-accent"
            >
              <option value="" disabled>
                Select model for White player
              </option>
              {MODELS.map((model) => (
                <option key={model} value={model} className="bg-terminal-card">
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Black Player Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="black-model"
              className="terminal-text font-mono text-sm"
            >
              ♛ BLACK PLAYER MODEL
            </Label>
            <select
              value={blackModel}
              onChange={(e) => setBlackModel(e.target.value)}
              className="w-full terminal-border bg-terminal-card terminal-text px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-terminal-accent"
            >
              <option value="" disabled>
                Select model for Black player
              </option>
              {MODELS.map((model) => (
                <option key={model} value={model} className="bg-terminal-card">
                  {model}
                </option>
              ))}
            </select>
          </div>

          <form action={action}>
            <input type="hidden" name="whitePlayerModelId" value={whiteModel} />
            <input type="hidden" name="blackPlayerModelId" value={blackModel} />
            <Button
              type="submit"
              disabled={!whiteModel || !blackModel || isPending}
            >
              {isPending ? (
                <span className="animate-pulse">⚔️ INITIALIZING BATTLE...</span>
              ) : (
                "🚀 START CHESS BATTLE"
              )}
            </Button>
          </form>

          {/* Validation Messages */}
          {whiteModel && blackModel && whiteModel === blackModel && (
            <div className="terminal-text text-red-400 text-sm text-center">
              ⚠️ Please select different models for each player
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
