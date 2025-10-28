"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";

import { AIModelsCollection } from "@/db/electric";

import { MODELS } from "@/lib/models";

import { type ModelOption, ModelSelect } from "@/components/model-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import {
  StartTournamentAction,
  type StartTournamentActionState,
  type TournamentMatch,
} from "@/actions/start-tournament.action";

type TournamentSize = 4 | 8 | 16 | 32;

interface TournamentPlayer {
  id: string;
  modelId: string;
  name: string;
  logo?: string;
}

interface BracketPosition {
  round: number;
  position: number;
  whitePlayer?: TournamentPlayer;
  blackPlayer?: TournamentPlayer;
  isSelectable: boolean;
}

const PROVIDER_LOGOS = {
  alibaba: "https://avatars.githubusercontent.com/u/137491736?s=200&v=4",
  anthropic: "https://avatars.githubusercontent.com/u/46360699?s=200&v=4",
  openai: "https://avatars.githubusercontent.com/u/14957082?s=200&v=4",
  cohere: "https://avatars.githubusercontent.com/u/29539506?s=200&v=4",
  xai: "https://avatars.githubusercontent.com/u/150673994?s=200&v=4",
  google: "https://avatars.githubusercontent.com/u/1342004?s=200&v=4",
  deepseek: "https://avatars.githubusercontent.com/u/139544350?s=200&v=4",
  moonshotai: "https://avatars.githubusercontent.com/u/126165481?s=200&v=4",
} as const;

function DiceIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <title>Dice Icon</title>
      <path
        d="M5 3H3v18h18V3H5zm14 2v14H5V5h14zM9 7H7v2h2V7zm6 0h2v2h-2V7zm-6 8H7v2h2v-2zm6 0h2v2h-2v-2zm-2-4h-2v2h2v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function ModelIcon({
  modelId,
  allModels,
  size = "sm",
}: {
  modelId: string;
  allModels?: Array<{
    canonical_id: string;
    name?: string | null;
    logo_url?: string | null;
  }> | null;
  size?: "sm" | "xs";
}) {
  const model = allModels?.find((m) => m.canonical_id === modelId);
  const sizeClass = size === "xs" ? "w-4 h-4" : "w-5 h-5";

  if (model?.logo_url) {
    return (
      <Image
        src={model.logo_url}
        alt={model.name || model.canonical_id}
        width={size === "xs" ? 16 : 20}
        height={size === "xs" ? 16 : 20}
        className={`${sizeClass} rounded shrink-0 object-cover`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  const provider = modelId?.split("/")[0] as keyof typeof PROVIDER_LOGOS;
  const providerLogo = provider ? PROVIDER_LOGOS[provider] : null;

  if (providerLogo) {
    return (
      <Image
        src={providerLogo}
        alt={provider || "AI Model"}
        width={size === "xs" ? 16 : 20}
        height={size === "xs" ? 16 : 20}
        className={`${sizeClass} rounded shrink-0 object-cover`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded bg-terminal-border flex items-center justify-center text-xs opacity-70 shrink-0`}
    >
      🧠
    </div>
  );
}

const mockModelOptions: ModelOption[] = MODELS.map((model, index) => ({
  canonical_id: model,
  name: model.split("/")[1]?.replace(/-/g, " ").toUpperCase() || model,
  description: `AI model ${index + 1}`,
  logo_url: null,
}));

export default function TournamentsClient() {
  const router = useRouter();
  const [tournamentSize, setTournamentSize] = useState<TournamentSize>(8);
  const [brackets, setBrackets] = useState<BracketPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"white" | "black" | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

  const { data: allModels } = useLiveQuery((q) =>
    q.from({ model: AIModelsCollection }).select(({ model }) => ({
      canonical_id: model.canonical_id,
      name: model.name,
      description: model.description,
      logo_url: model.logo_url,
      provider: model.provider,
    })),
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const initialState: StartTournamentActionState = {
    input: {},
    output: { success: false },
  };

  const [actionState, formAction, isPending] = useActionState(
    StartTournamentAction,
    initialState,
  );

  useEffect(() => {
    if (actionState.output.success && actionState.output.data?.tournamentId) {
      router.push(`/tournaments/${actionState.output.data.tournamentId}`);
    }
  }, [actionState.output, router]);

  const getTournamentData = () => {
    const firstRoundBrackets = brackets.filter((b) => b.round === 0);
    const matches: TournamentMatch[] = firstRoundBrackets
      .filter((b) => b.whitePlayer && b.blackPlayer)
      .map((b) => ({
        whitePlayerModelId: b.whitePlayer?.modelId || "",
        blackPlayerModelId: b.blackPlayer?.modelId || "",
      }));

    return {
      tournamentName: `${tournamentSize} Player Tournament`,
      tournamentSize: tournamentSize.toString(),
      matches: JSON.stringify(matches),
    };
  };

  useEffect(() => {
    const initializeBrackets = () => {
      const totalRounds = Math.log2(tournamentSize);
      const positions: BracketPosition[] = [];

      for (let round = 0; round < totalRounds; round++) {
        const positionsInRound = tournamentSize / 2 ** (round + 1);
        for (let position = 0; position < positionsInRound; position++) {
          positions.push({
            round,
            position,
            isSelectable: round === 0,
          });
        }
      }

      setBrackets(positions);
    };

    initializeBrackets();
  }, [tournamentSize]);

  const getPositionId = (round: number, position: number) =>
    `${round}-${position}`;

  const handlePlayerSelect = (modelId: string) => {
    if (!selectedPosition || !selectedSide) return;

    const [round, position] = selectedPosition.split("-").map(Number);
    const modelsToUse =
      allModels && allModels.length > 0 ? allModels : mockModelOptions;
    const selectedModel = modelsToUse.find((m) => m.canonical_id === modelId);

    const newPlayer: TournamentPlayer = {
      id: `player-${Date.now()}`,
      modelId,
      name: selectedModel?.name || modelId,
      logo: selectedModel?.logo_url || undefined,
    };

    setBrackets((prev) =>
      prev.map((bracket) =>
        bracket.round === round && bracket.position === position
          ? {
              ...bracket,
              [selectedSide === "white" ? "whitePlayer" : "blackPlayer"]:
                newPlayer,
            }
          : bracket,
      ),
    );
    setSelectedPosition(null);
    setSelectedSide(null);
  };

  const handleSwapPlayer = (round: number, position: number) => {
    const usedModels = new Set<string>();
    brackets.forEach((bracket) => {
      if (bracket.whitePlayer) usedModels.add(bracket.whitePlayer.modelId);
      if (bracket.blackPlayer) usedModels.add(bracket.blackPlayer.modelId);
    });

    const modelsToUse =
      allModels && allModels.length > 0 ? allModels : mockModelOptions;
    const availableModels = modelsToUse.filter(
      (model) => !usedModels.has(model.canonical_id),
    );

    if (availableModels.length < 2) return;

    const shuffledModels = [...availableModels].sort(() => Math.random() - 0.5);
    const whiteModel = shuffledModels[0];
    const blackModel = shuffledModels[1];

    const whitePlayer: TournamentPlayer = {
      id: `player-${Date.now()}-white`,
      modelId: whiteModel.canonical_id,
      name: whiteModel.name || whiteModel.canonical_id,
      logo: whiteModel.logo_url || undefined,
    };

    const blackPlayer: TournamentPlayer = {
      id: `player-${Date.now()}-black`,
      modelId: blackModel.canonical_id,
      name: blackModel.name || blackModel.canonical_id,
      logo: blackModel.logo_url || undefined,
    };

    setBrackets((prev) =>
      prev.map((bracket) =>
        bracket.round === round && bracket.position === position
          ? { ...bracket, whitePlayer, blackPlayer }
          : bracket,
      ),
    );
  };

  const handlePopulateRandom = () => {
    const firstRoundPositions = brackets.filter((b) => b.round === 0);
    const emptyPositions = firstRoundPositions.filter(
      (b) => !b.whitePlayer || !b.blackPlayer,
    );

    const usedModels = new Set<string>();
    brackets.forEach((bracket) => {
      if (bracket.whitePlayer) usedModels.add(bracket.whitePlayer.modelId);
      if (bracket.blackPlayer) usedModels.add(bracket.blackPlayer.modelId);
    });

    const modelsToUse =
      allModels && allModels.length > 0 ? allModels : mockModelOptions;
    const availableModels = modelsToUse.filter(
      (model) => !usedModels.has(model.canonical_id),
    );
    const shuffledModels = [...availableModels].sort(() => Math.random() - 0.5);

    setBrackets((prev) => {
      const updated = [...prev];
      let modelIndex = 0;

      emptyPositions.forEach((emptyPos) => {
        const bracketIndex = updated.findIndex(
          (b) => b.round === emptyPos.round && b.position === emptyPos.position,
        );

        if (bracketIndex !== -1 && modelIndex < shuffledModels.length - 1) {
          const bracket = updated[bracketIndex];

          if (!bracket.whitePlayer && modelIndex < shuffledModels.length) {
            const whiteModel = shuffledModels[modelIndex++];
            bracket.whitePlayer = {
              id: `player-${Date.now()}-${emptyPos.position}-white`,
              modelId: whiteModel.canonical_id,
              name: whiteModel.name || whiteModel.canonical_id,
              logo: whiteModel.logo_url || undefined,
            };
          }

          if (!bracket.blackPlayer && modelIndex < shuffledModels.length) {
            const blackModel = shuffledModels[modelIndex++];
            bracket.blackPlayer = {
              id: `player-${Date.now()}-${emptyPos.position}-black`,
              modelId: blackModel.canonical_id,
              name: blackModel.name || blackModel.canonical_id,
              logo: blackModel.logo_url || undefined,
            };
          }
        }
      });
      return updated;
    });
  };

  const handleShuffleAll = () => {
    const firstRoundPositions = brackets.filter((b) => b.round === 0);
    const modelsToUse =
      allModels && allModels.length > 0 ? allModels : mockModelOptions;
    const availableModels = [...modelsToUse].sort(() => Math.random() - 0.5);

    setBrackets((prev) => {
      const updated = [...prev];
      let modelIndex = 0;

      firstRoundPositions.forEach((pos) => {
        const bracketIndex = updated.findIndex(
          (b) => b.round === pos.round && b.position === pos.position,
        );

        if (bracketIndex !== -1 && modelIndex < availableModels.length - 1) {
          const whiteModel = availableModels[modelIndex++];
          const blackModel = availableModels[modelIndex++];

          updated[bracketIndex] = {
            ...updated[bracketIndex],
            whitePlayer: {
              id: `player-${Date.now()}-${pos.position}-white`,
              modelId: whiteModel.canonical_id,
              name: whiteModel.name || whiteModel.canonical_id,
              logo: whiteModel.logo_url || undefined,
            },
            blackPlayer: {
              id: `player-${Date.now()}-${pos.position}-black`,
              modelId: blackModel.canonical_id,
              name: blackModel.name || blackModel.canonical_id,
              logo: blackModel.logo_url || undefined,
            },
          };
        }
      });
      return updated;
    });
  };

  const getRoundLabel = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return "FINAL";
    if (roundIndex === totalRounds - 2) return "SEMIS";
    if (roundIndex === totalRounds - 3) return "QUARTERS";
    if (roundIndex === totalRounds - 4) return "ROUND OF 16";
    return `ROUND ${roundIndex + 1}`;
  };

  const PlayerSlot = ({ bracket }: { bracket: BracketPosition }) => {
    const positionId = getPositionId(bracket.round, bracket.position);

    if (!bracket.isSelectable) {
      return (
        <div className="w-60 h-24 bg-black/40 border-2 border-yellow-600/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <span className="text-yellow-400 text-sm font-mono font-bold tracking-wide">
            TBD
          </span>
        </div>
      );
    }

    const hasPlayers = bracket.whitePlayer || bracket.blackPlayer;
    const isComplete = bracket.whitePlayer && bracket.blackPlayer;

    if (hasPlayers) {
      return (
        <div className="relative group">
          <div
            className={`w-60 h-24 rounded-lg p-3 transition-all duration-200 ${
              isComplete
                ? "bg-green-900/20 border-2 border-green-500/60 shadow-lg shadow-green-500/10"
                : "bg-orange-900/20 border-2 border-orange-500/60"
            }`}
          >
            <button
              type="button"
              className="flex items-center mb-2 p-2 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group/white w-full text-left"
              onClick={() => {
                if (!bracket.whitePlayer) {
                  setSelectedPosition(positionId);
                  setSelectedSide("white");
                }
              }}
            >
              <div className="w-3 h-3 bg-white rounded mr-3 border border-white/70 shrink-0"></div>
              {bracket.whitePlayer ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ModelIcon
                    modelId={bracket.whitePlayer.modelId}
                    allModels={allModels}
                    size="xs"
                  />
                  <div className="text-xs font-mono font-medium text-white truncate">
                    {bracket.whitePlayer.name}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/60 group-hover/white:text-white font-mono">
                  + Add White Player
                </div>
              )}
            </button>

            <button
              type="button"
              className="flex items-center p-2 rounded bg-gray-900/30 hover:bg-gray-800/40 transition-colors cursor-pointer group/black w-full text-left"
              onClick={() => {
                if (!bracket.blackPlayer) {
                  setSelectedPosition(positionId);
                  setSelectedSide("black");
                }
              }}
            >
              <div className="w-3 h-3 bg-gray-800 rounded mr-3 border border-white/50 shrink-0"></div>
              {bracket.blackPlayer ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ModelIcon
                    modelId={bracket.blackPlayer.modelId}
                    allModels={allModels}
                    size="xs"
                  />
                  <div className="text-xs font-mono font-medium text-white truncate">
                    {bracket.blackPlayer.name}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/60 group-hover/black:text-white font-mono">
                  + Add Black Player
                </div>
              )}
            </button>
          </div>

          <button
            type="button"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/90 hover:bg-primary text-black text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-primary/20"
            onClick={() => handleSwapPlayer(bracket.round, bracket.position)}
            title="Random players"
          >
            <DiceIcon className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <div className="w-60 h-24 border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 rounded-lg flex flex-col p-3 transition-all cursor-pointer group">
        <button
          type="button"
          className="flex items-center mb-2 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer group/white w-full text-left"
          onClick={() => {
            setSelectedPosition(positionId);
            setSelectedSide("white");
          }}
        >
          <div className="w-3 h-3 bg-white rounded mr-3 border border-white/50 shrink-0"></div>
          <div className="text-xs text-white/50 group-hover/white:text-white/80 font-mono">
            + Add White Player
          </div>
        </button>

        <button
          type="button"
          className="flex items-center p-2 rounded hover:bg-gray-900/20 transition-colors cursor-pointer group/black w-full text-left"
          onClick={() => {
            setSelectedPosition(positionId);
            setSelectedSide("black");
          }}
        >
          <div className="w-3 h-3 bg-gray-800 rounded mr-3 border border-white/30 shrink-0"></div>
          <div className="text-xs text-white/50 group-hover/black:text-white/80 font-mono">
            + Add Black Player
          </div>
        </button>
      </div>
    );
  };

  const renderBracket = () => {
    const rounds = Math.log2(tournamentSize);
    const roundsData: BracketPosition[][] = [];

    for (let round = 0; round < rounds; round++) {
      roundsData.push(brackets.filter((b) => b.round === round));
    }

    const completedMatches = brackets.filter(
      (b) => b.round === 0 && b.whitePlayer && b.blackPlayer,
    ).length;
    const totalMatches = brackets.filter((b) => b.round === 0).length;

    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-mono text-terminal-text">
              Tournament Progress
            </div>
            <div className="text-xs font-mono text-primary">
              {completedMatches}/{totalMatches} matches
            </div>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedMatches / totalMatches) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max">
            {roundsData.map((roundBrackets, roundIndex) => (
              <div
                key={`header-round-${roundIndex}-${roundBrackets.length}`}
                className="text-center px-4 flex-shrink-0"
                style={{ width: "280px" }}
              >
                <div className="bg-primary/10 border border-primary/30 rounded-lg py-3 px-4">
                  <h3 className="text-primary font-mono text-sm font-bold">
                    {getRoundLabel(roundIndex, rounds)}
                  </h3>
                  <div className="text-white/50 font-mono text-xs mt-1">
                    {roundBrackets.length}{" "}
                    {roundBrackets.length === 1 ? "match" : "matches"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="flex items-center min-w-max pb-4"
            style={{ minHeight: `${Math.max(4, tournamentSize / 2) * 96}px` }}
          >
            {roundsData.map((roundBrackets, roundIndex) => (
              <div
                key={`round-${roundIndex}-${roundBrackets.length}`}
                className="flex flex-col justify-center items-center relative flex-shrink-0"
                style={{ width: "280px" }}
              >
                <div
                  className="flex flex-col justify-around items-center h-full w-full"
                  style={{
                    minHeight: `${Math.max(4, roundBrackets.length) * 96 + (roundBrackets.length - 1) * 32}px`,
                  }}
                >
                  {roundBrackets.map((bracket, bracketIndex) => (
                    <div
                      key={`${bracket.round}-${bracket.position}`}
                      className="relative flex items-center justify-center"
                      style={{
                        marginBottom:
                          bracketIndex < roundBrackets.length - 1
                            ? `${2 ** (roundIndex + 1) * 32}px`
                            : "0px",
                      }}
                    >
                      <PlayerSlot bracket={bracket} />

                      {roundIndex < rounds - 1 && bracket.isSelectable && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                          <div className="w-10 h-px bg-primary/40 absolute right-0 top-0"></div>
                          {bracketIndex % 2 === 0 ? (
                            <div
                              className="w-px bg-primary/40 absolute right-10 top-0"
                              style={{
                                height: `${2 ** (roundIndex + 1) * 48 + 16}px`,
                              }}
                            />
                          ) : (
                            <div
                              className="w-px bg-primary/40 absolute right-10 bottom-0"
                              style={{
                                height: `${2 ** (roundIndex + 1) * 48 + 16}px`,
                              }}
                            />
                          )}
                          {bracketIndex % 2 === 1 && (
                            <div
                              className="w-10 h-px bg-primary/40 absolute right-10"
                              style={{
                                top: `${-(2 ** (roundIndex + 1) * 48 + 16)}px`,
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="text-primary font-mono text-lg font-bold">
              {tournamentSize}
            </div>
            <div className="text-white/60 text-xs font-mono">PLAYERS</div>
          </div>
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="text-primary font-mono text-lg font-bold">
              {Math.log2(tournamentSize)}
            </div>
            <div className="text-white/60 text-xs font-mono">ROUNDS</div>
          </div>
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="text-primary font-mono text-lg font-bold">
              {
                brackets.filter(
                  (b) => b.round === 0 && b.whitePlayer && b.blackPlayer,
                ).length
              }
            </div>
            <div className="text-white/60 text-xs font-mono">COMPLETED</div>
          </div>
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="text-primary font-mono text-lg font-bold">
              {brackets.filter((b) => b.round === 0).length -
                brackets.filter(
                  (b) => b.round === 0 && b.whitePlayer && b.blackPlayer,
                ).length}
            </div>
            <div className="text-white/60 text-xs font-mono">PENDING</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="text-foreground"
              >
                <title>Tournament Icon</title>
                <path
                  d="M16 3H6v2H2v10h6V5h8v10h6V5h-4V3h-2zm4 4v6h-2V7h2zM6 13H4V7h2v6zm12 2H6v2h12v-2zm-7 2h2v2h3v2H8v-2h3v-2z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h1 className="terminal-text terminal-glow text-4xl font-bold">
                TOURNAMENTS
              </h1>
            </div>
          </div>
          <p className="terminal-text text-lg opacity-90 max-w-2xl mx-auto">
            Organize epic AI chess tournaments with bracket elimination
            <br />
            <span className="text-primary">Setup matches</span> •{" "}
            <span className="text-primary">Track progress</span> •{" "}
            <span className="text-primary">Crown champions</span>
          </p>
        </div>

        <div className="terminal-card terminal-border mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="terminal-text terminal-glow text-lg font-mono">
                  ⚙️ CONFIGURATION
                </h3>
                <p className="terminal-text text-sm opacity-70 mt-1">
                  Choose tournament size and setup matches
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs terminal-text opacity-60">
                <span>Rounds: {Math.log2(tournamentSize)}</span>
                <span>•</span>
                <span>Matches: {tournamentSize / 2}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {([4, 8, 16, 32] as TournamentSize[]).map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setTournamentSize(size)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    tournamentSize === size
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "border-white/20 text-terminal-text hover:border-primary/30 hover:bg-primary/10"
                  }`}
                >
                  <div className="font-mono text-lg font-bold">{size}</div>
                  <div className="text-xs opacity-70">PLAYERS</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={handlePopulateRandom}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/30 border border-green-600/50 text-green-400 hover:bg-green-900/50 transition-colors font-mono text-sm"
              >
                <DiceIcon className="w-4 h-4" />
                Fill Empty
              </button>
              <button
                type="button"
                onClick={handleShuffleAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-600/50 text-purple-400 hover:bg-purple-900/50 transition-colors font-mono text-sm"
              >
                <span>🔀</span>
                Shuffle All
              </button>
              <button
                type="button"
                onClick={() =>
                  setBrackets((prev) =>
                    prev.map((b) => ({
                      ...b,
                      whitePlayer: undefined,
                      blackPlayer: undefined,
                    })),
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-red-600/50 text-red-400 hover:bg-red-900/50 transition-colors font-mono text-sm"
              >
                <span>🗑️</span>
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="terminal-card terminal-border">{renderBracket()}</div>
      </div>

      {brackets
        .filter((b) => b.round === 0)
        .every((b) => b.whitePlayer && b.blackPlayer) && (
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="terminal-card terminal-border">
            <div className="p-6 text-center">
              <div className="mb-4">
                <h3 className="terminal-text terminal-glow text-lg font-mono mb-2">
                  🚀 READY TO LAUNCH
                </h3>
                <p className="terminal-text text-sm opacity-70">
                  All matches configured. Start the tournament to begin battles!
                </p>
              </div>
              <form action={formAction}>
                {(() => {
                  const tournamentData = getTournamentData();
                  return (
                    <>
                      <input
                        type="hidden"
                        name="tournamentName"
                        value={tournamentData.tournamentName}
                      />
                      <input
                        type="hidden"
                        name="tournamentSize"
                        value={tournamentData.tournamentSize}
                      />
                      <input
                        type="hidden"
                        name="matches"
                        value={tournamentData.matches}
                      />
                    </>
                  );
                })()}
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-bold text-lg rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/50 shadow-lg shadow-primary/20"
                >
                  {isPending ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      STARTING...
                    </>
                  ) : (
                    <>
                      <span>⚔️</span>
                      START TOURNAMENT
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {!actionState.output.success && actionState.output.error && (
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <div className="flex justify-center">
            <div className="terminal-card border border-red-500/50 bg-red-900/20 p-4 max-w-md">
              <div className="terminal-text text-red-400 text-sm font-mono">
                ❌ {actionState.output.error}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPosition && selectedSide && (
        <>
          <Dialog
            open={
              !isMobile && selectedPosition !== null && selectedSide !== null
            }
            onOpenChange={(open) => {
              if (!open) {
                setSelectedPosition(null);
                setSelectedSide(null);
              }
            }}
          >
            <DialogContent className="terminal-card terminal-border max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-4 h-4 rounded border-2 ${
                      selectedSide === "white"
                        ? "bg-white border-white"
                        : "bg-gray-800 border-white/50"
                    }`}
                  />
                  <div className="text-left">
                    <DialogTitle className="terminal-text terminal-glow font-mono text-lg">
                      SELECT PLAYER
                    </DialogTitle>
                    <p className="terminal-text text-sm opacity-60 mt-1">
                      Choose {selectedSide} side AI model
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <ModelSelect
                label="Available Models"
                items={
                  allModels && allModels.length > 0
                    ? allModels.filter(
                        (model) =>
                          !brackets.some(
                            (bracket) =>
                              bracket.whitePlayer?.modelId ===
                                model.canonical_id ||
                              bracket.blackPlayer?.modelId ===
                                model.canonical_id,
                          ),
                      )
                    : mockModelOptions.filter(
                        (model) =>
                          !brackets.some(
                            (bracket) =>
                              bracket.whitePlayer?.modelId ===
                                model.canonical_id ||
                              bracket.blackPlayer?.modelId ===
                                model.canonical_id,
                          ),
                      )
                }
                value=""
                onChange={handlePlayerSelect}
                placeholder="Search and select model..."
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPosition(null);
                    setSelectedSide(null);
                  }}
                  className="flex-1 px-4 py-3 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg transition-colors font-mono text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const modelsToUse =
                      allModels && allModels.length > 0
                        ? allModels
                        : mockModelOptions;
                    const available = modelsToUse.filter(
                      (model) =>
                        !brackets.some(
                          (bracket) =>
                            bracket.whitePlayer?.modelId ===
                              model.canonical_id ||
                            bracket.blackPlayer?.modelId === model.canonical_id,
                        ),
                    );
                    if (available.length > 0) {
                      const randomModel =
                        available[Math.floor(Math.random() * available.length)];
                      handlePlayerSelect(randomModel.canonical_id);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 rounded-lg transition-colors font-mono text-sm inline-flex items-center justify-center gap-2"
                >
                  <DiceIcon className="!text-foreground w-4 h-4" />
                  Random
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <Drawer
            open={
              isMobile && selectedPosition !== null && selectedSide !== null
            }
            onOpenChange={(open) => {
              if (!open) {
                setSelectedPosition(null);
                setSelectedSide(null);
              }
            }}
          >
            <DrawerContent className="terminal-card">
              <DrawerHeader>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div
                    className={`w-4 h-4 rounded border-2 ${
                      selectedSide === "white"
                        ? "bg-white border-white"
                        : "bg-gray-800 border-white/50"
                    }`}
                  />
                  <div className="text-center">
                    <DrawerTitle className="terminal-text terminal-glow font-mono text-lg">
                      SELECT PLAYER
                    </DrawerTitle>
                    <p className="terminal-text text-sm opacity-60 mt-1">
                      Choose {selectedSide} side AI model
                    </p>
                  </div>
                </div>
              </DrawerHeader>

              <div className="px-4 pb-6">
                <ModelSelect
                  label="Available Models"
                  items={
                    allModels && allModels.length > 0
                      ? allModels.filter(
                          (model) =>
                            !brackets.some(
                              (bracket) =>
                                bracket.whitePlayer?.modelId ===
                                  model.canonical_id ||
                                bracket.blackPlayer?.modelId ===
                                  model.canonical_id,
                            ),
                        )
                      : mockModelOptions.filter(
                          (model) =>
                            !brackets.some(
                              (bracket) =>
                                bracket.whitePlayer?.modelId ===
                                  model.canonical_id ||
                                bracket.blackPlayer?.modelId ===
                                  model.canonical_id,
                            ),
                        )
                  }
                  value=""
                  onChange={handlePlayerSelect}
                  placeholder="Search and select model..."
                />

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition(null);
                      setSelectedSide(null);
                    }}
                    className="flex-1 px-4 py-3 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg transition-colors font-mono text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const modelsToUse =
                        allModels && allModels.length > 0
                          ? allModels
                          : mockModelOptions;
                      const available = modelsToUse.filter(
                        (model) =>
                          !brackets.some(
                            (bracket) =>
                              bracket.whitePlayer?.modelId ===
                                model.canonical_id ||
                              bracket.blackPlayer?.modelId ===
                                model.canonical_id,
                          ),
                      );
                      if (available.length > 0) {
                        const randomModel =
                          available[
                            Math.floor(Math.random() * available.length)
                          ];
                        handlePlayerSelect(randomModel.canonical_id);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 rounded-lg transition-colors font-mono text-sm inline-flex items-center justify-center gap-2"
                  >
                    <DiceIcon className="w-4 h-4" />
                    Random
                  </button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}

      <div className="h-8" />
    </div>
  );
}
