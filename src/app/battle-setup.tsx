"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useLiveQuery } from "@tanstack/react-db";

import { AIModelsCollection } from "@/db/electric";

import { MODELS } from "@/lib/models";

import { ModelSelect } from "@/components/model-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { StartBattleAction } from "@/actions/start-battle.action";

export default function BattleSetup() {
  const router = useRouter();
  const [whiteModel, setWhiteModel] = React.useState<string>("");
  const [blackModel, setBlackModel] = React.useState<string>("");
  const [engineMode, setEngineMode] = React.useState<"json" | "streaming">(
    "json",
  );

  const { data: models } = useLiveQuery((q) =>
    q.from({ model: AIModelsCollection }).select(({ model }) => ({
      canonical_id: model.canonical_id,
      name: model.name,
      description: model.description,
      logo_url: model.logo_url,
      provider: model.provider,
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
    <Card className="terminal-card terminal-border">
      <CardHeader className="pb-4">
        <CardTitle className="terminal-text terminal-glow text-lg font-mono text-center">
          ⚔️ CHOOSE YOUR MODELS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignedOut>
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
            <div className="text-6xl">🎮</div>
            <div className="text-center space-y-2">
              <h3 className="terminal-text text-lg font-mono terminal-glow">
                Ready to Battle?
              </h3>
              <p className="terminal-text text-sm opacity-80 max-w-sm">
                Login and claim your free credits to start playing chess battles
                with AI models
              </p>
            </div>
            <SignInButton mode="modal">
              <Button className="terminal-button px-8 py-3">
                🚀 Login & Claim Free Credits
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Model Selection Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <ModelSelect
              label="♔ WHITE"
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
              placeholder="Select White model"
            />

            <ModelSelect
              label="♛ BLACK"
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
              placeholder="Select Black model"
            />
          </div>

          <form action={action} className="space-y-3">
            <input type="hidden" name="whitePlayerModelId" value={whiteModel} />
            <input type="hidden" name="blackPlayerModelId" value={blackModel} />
            <input type="hidden" name="engineMode" value={engineMode} />

            <div className="flex items-center justify-between text-xs">
              <span className="terminal-text font-mono">Engine Mode:</span>
              <div className="flex gap-3">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="engineModeRadio"
                    checked={engineMode === "json"}
                    onChange={() => setEngineMode("json")}
                    className="w-3 h-3"
                  />
                  <span className="terminal-text text-xs">JSON</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="engineModeRadio"
                    checked={engineMode === "streaming"}
                    onChange={() => setEngineMode("streaming")}
                    className="w-3 h-3"
                  />
                  <span className="terminal-text text-xs">Streaming</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!whiteModel || !blackModel || isPending}
              className="w-full terminal-button h-12"
              size="lg"
            >
              {isPending ? (
                <span className="animate-pulse">⚔️ INITIALIZING...</span>
              ) : (
                <span className="font-sans">🚀 START BATTLE</span>
              )}
            </Button>
          </form>

          {/* Validation Messages */}
          {whiteModel && blackModel && whiteModel === blackModel && (
            <div className="terminal-text text-red-400 text-xs text-center">
              ⚠️ Please select different models for each player
            </div>
          )}
        </SignedIn>
      </CardContent>
    </Card>
  );
}
