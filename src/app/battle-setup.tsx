"use client";

import { SignedOut, SignInButton } from "@clerk/nextjs";
import { useLiveQuery } from "@tanstack/react-db";
import { useRouter } from "next/navigation";
import * as React from "react";

import { StartBattleAction } from "@/actions/start-battle.action";

import { ModelSelect } from "@/components/model-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AIModelsCollection } from "@/db/electric";

import { MODELS } from "@/lib/models";

export default function BattleSetup() {
  const router = useRouter();
  const [whiteModel, setWhiteModel] = React.useState<string>("");
  const [blackModel, setBlackModel] = React.useState<string>("");

  const { data: models } = useLiveQuery((q) =>
    q.from({ model: AIModelsCollection }).select(({ model }) => ({
      ...model,
    })),
  );

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
          <SignedOut>
            <div className="terminal-text text-sm bg-yellow-950/30 border border-yellow-700/40 rounded-md p-3">
              You can start one battle as a guest. Sign in to create unlimited
              battles and keep your history.
              <div className="mt-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="terminal-border bg-terminal-card px-3 py-2 rounded-md hover:bg-terminal-card/80"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </div>
          </SignedOut>
          {/* White Player Selection */}
          <ModelSelect
            label="♔ WHITE PLAYER MODEL"
            items={
              models.length > 0
                ? models
                : MODELS.map((m) => ({
                    canonical_id: m,
                    name: m,
                    description: null,
                    logo_url: null,
                  }))
            }
            value={whiteModel}
            onChange={setWhiteModel}
            placeholder="Select model for White player"
          />

          {/* Black Player Selection */}
          <ModelSelect
            label="♛ BLACK PLAYER MODEL"
            items={
              models.length > 0
                ? models
                : MODELS.map((m) => ({
                    canonical_id: m,
                    name: m,
                    description: null,
                    logo_url: null,
                  }))
            }
            value={blackModel}
            onChange={setBlackModel}
            placeholder="Select model for Black player"
          />

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
      {/* ModelSelect renders its own preview in the dropdown */}
    </div>
  );
}
