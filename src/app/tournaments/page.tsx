"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModelSelect, type ModelOption } from "@/components/ModelSelect";
import { MODELS } from "@/lib/models";
import { StartTournamentAction, type StartTournamentActionState, type TournamentMatch } from "@/actions/start-tournament.action";

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

// Mock model options - in real app, fetch from API
const mockModelOptions: ModelOption[] = MODELS.map((model, index) => ({
  canonical_id: model,
  name: model.split("/")[1]?.replace(/-/g, " ").toUpperCase() || model,
  description: `AI model ${index + 1}`,
  logo_url: null,
}));

export default function TournamentsPage() {
  const router = useRouter();
  const [tournamentSize, setTournamentSize] = useState<TournamentSize>(8);
  const [brackets, setBrackets] = useState<BracketPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"white" | "black" | null>(
    null
  );

  // Initialize tournament action state
  const initialState: StartTournamentActionState = {
    input: {},
    output: { success: false },
  };
  
  const [actionState, formAction, isPending] = useActionState(
    StartTournamentAction,
    initialState
  );

  // Handle successful tournament creation
  useEffect(() => {
    if (actionState.output.success && actionState.output.data?.tournamentId) {
      // Redirect to tournament view or show success message
      router.push(`/tournaments/${actionState.output.data.tournamentId}`);
    }
  }, [actionState.output, router]);

  // Get tournament data for form submission
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

  // Initialize bracket positions based on tournament size
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
            isSelectable: round === 0, // Only first round positions are selectable
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
    const newPlayer: TournamentPlayer = {
      id: `player-${Date.now()}`,
      modelId,
      name:
        mockModelOptions.find((m) => m.canonical_id === modelId)?.name ||
        modelId,
      logo:
        mockModelOptions.find((m) => m.canonical_id === modelId)?.logo_url ||
        undefined,
    };

    setBrackets((prev) =>
      prev.map((bracket) =>
        bracket.round === round && bracket.position === position
          ? {
              ...bracket,
              [selectedSide === "white" ? "whitePlayer" : "blackPlayer"]:
                newPlayer,
            }
          : bracket
      )
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

    const availableModels = mockModelOptions.filter(
      (model) => !usedModels.has(model.canonical_id)
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
          : bracket
      )
    );
  };

  const handlePopulateRandom = () => {
    const firstRoundPositions = brackets.filter((b) => b.round === 0);
    const emptyPositions = firstRoundPositions.filter(
      (b) => !b.whitePlayer || !b.blackPlayer
    );

    const usedModels = new Set<string>();
    brackets.forEach((bracket) => {
      if (bracket.whitePlayer) usedModels.add(bracket.whitePlayer.modelId);
      if (bracket.blackPlayer) usedModels.add(bracket.blackPlayer.modelId);
    });

    const availableModels = mockModelOptions.filter(
      (model) => !usedModels.has(model.canonical_id)
    );
    const shuffledModels = [...availableModels].sort(() => Math.random() - 0.5);

    setBrackets((prev) => {
      const updated = [...prev];
      let modelIndex = 0;

      emptyPositions.forEach((emptyPos) => {
        const bracketIndex = updated.findIndex(
          (b) => b.round === emptyPos.round && b.position === emptyPos.position
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
    const availableModels = [...mockModelOptions].sort(
      () => Math.random() - 0.5
    );

    setBrackets((prev) => {
      const updated = [...prev];
      let modelIndex = 0;

      firstRoundPositions.forEach((pos) => {
        const bracketIndex = updated.findIndex(
          (b) => b.round === pos.round && b.position === pos.position
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
        <div className="w-40 h-20 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-600/40 rounded-md flex items-center justify-center backdrop-blur-sm">
          <span className="text-yellow-300 text-xs font-mono font-bold tracking-wider">
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
            className={`w-40 h-20 bg-gradient-to-r from-slate-800 to-slate-700 border-2 ${
              isComplete ? "border-green-500/60" : "border-orange-500/60"
            } rounded-md flex flex-col p-2 backdrop-blur-sm shadow-lg`}
          >
            {/* White Player */}
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-white rounded-sm mr-2 border border-gray-400"></div>
              <div className="flex-1 min-w-0">
                {bracket.whitePlayer ? (
                  <div className="text-xs font-bold text-white truncate">
                    {bracket.whitePlayer.name}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                    onClick={() => {
                      setSelectedPosition(positionId);
                      setSelectedSide("white");
                    }}
                  >
                    + White
                  </button>
                )}
              </div>
            </div>

            {/* Black Player */}
            <div className="flex items-center">
              <div className="w-3 h-3 bg-black rounded-sm mr-2 border border-gray-400"></div>
              <div className="flex-1 min-w-0">
                {bracket.blackPlayer ? (
                  <div className="text-xs font-bold text-white truncate">
                    {bracket.blackPlayer.name}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                    onClick={() => {
                      setSelectedPosition(positionId);
                      setSelectedSide("black");
                    }}
                  >
                    + Black
                  </button>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="absolute -top-1 -right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-500 hover:bg-yellow-400 border-yellow-400 text-black"
            onClick={() => handleSwapPlayer(bracket.round, bracket.position)}
          >
            🔄
          </Button>
        </div>
      );
    }

    return (
      <div className="w-40 h-20 border-2 border-dashed border-gray-500 hover:border-gray-300 hover:bg-gray-700/50 rounded-md flex flex-col p-2 transition-all cursor-pointer">
        {/* White Player Selection */}
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-white rounded-sm mr-2 border border-gray-400"></div>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-white flex-1 text-left"
            onClick={() => {
              setSelectedPosition(positionId);
              setSelectedSide("white");
            }}
          >
            + White
          </button>
        </div>

        {/* Black Player Selection */}
        <div className="flex items-center">
          <div className="w-3 h-3 bg-black rounded-sm mr-2 border border-gray-400"></div>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-white flex-1 text-left"
            onClick={() => {
              setSelectedPosition(positionId);
              setSelectedSide("black");
            }}
          >
            + Black
          </button>
        </div>
      </div>
    );
  };

  const renderBracket = () => {
    const rounds = Math.log2(tournamentSize);
    const roundsData: BracketPosition[][] = [];

    // Group brackets by round
    for (let round = 0; round < rounds; round++) {
      roundsData.push(brackets.filter((b) => b.round === round));
    }

    return (
      <div className="w-full max-w-7xl mx-auto p-6 overflow-x-auto">
        <div className="flex items-center justify-center gap-8 min-w-fit">
          {roundsData.map((roundBrackets, roundIndex) => (
            <div
              key={`round-${
                // biome-ignore lint/suspicious/noArrayIndexKey: necessary man
                roundIndex
              }`}
              className="flex flex-col items-center"
            >
              {/* Round Header */}
              <div className="text-center mb-4">
                <h3 className="text-yellow-400 font-mono text-xs font-bold whitespace-nowrap">
                  {getRoundLabel(roundIndex, rounds)}
                </h3>
                <div className="text-yellow-600 font-mono text-xs mt-1">
                  {roundBrackets.length}{" "}
                  {roundBrackets.length === 1 ? "Match" : "Matches"}
                </div>
              </div>

              {/* Round Matches */}
              <div className="flex flex-col gap-3">
                {roundBrackets.map((bracket) => (
                  <PlayerSlot
                    key={`${bracket.round}-${bracket.position}`}
                    bracket={bracket}
                  />
                ))}
              </div>

              {/* Connector to next round */}
              {roundIndex < rounds - 1 && (
                <div className="flex items-center justify-center mt-4 ml-8 mr-8">
                  <div className="w-8 h-px bg-yellow-600/60"></div>
                  <div className="w-0 h-0 border-l-4 border-l-yellow-600/60 border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tournament Summary */}
        <div className="mt-8 text-center">
          <div className="text-yellow-600 font-mono text-sm">
            {tournamentSize} Players • {rounds} Rounds •{" "}
            {
              brackets.filter(
                (b) => b.round === 0 && b.whitePlayer && b.blackPlayer
              ).length
            }
            /{brackets.filter((b) => b.round === 0).length} Matches Complete
          </div>
          <div className="text-yellow-500/60 font-mono text-xs mt-2">
            Round breakdown:{" "}
            {roundsData
              .map((round, i) => `R${i + 1}: ${round.length}`)
              .join(" • ")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-block p-6 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          CHESS BATTLE
        </h1>
        <h2 className="text-2xl font-bold text-white mb-4">AI TOURNAMENT</h2>
        <p className="text-gray-300">
          Select your AI warriors for the ultimate chess battle
        </p>
      </div>

      {/* Tournament Size Selector */}
      <div className="flex justify-center gap-4 mb-8">
        {([4, 8, 16, 32] as TournamentSize[]).map((size) => (
          <Button
            key={size}
            variant={tournamentSize === size ? "default" : "outline"}
            className={`${
              tournamentSize === size
                ? "bg-yellow-600 hover:bg-yellow-500 text-black"
                : "border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
            }`}
            onClick={() => setTournamentSize(size)}
          >
            {size} Players
          </Button>
        ))}
      </div>

      {/* Tournament Bracket */}
      <div className="bg-black/40 backdrop-blur-sm border border-yellow-600/30 rounded-xl mx-4 mb-8">
        {renderBracket()}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          className="bg-green-600 hover:bg-green-500 text-white"
          onClick={handlePopulateRandom}
        >
          🎲 Populate Random
        </Button>
        <Button
          className="bg-purple-600 hover:bg-purple-500 text-white"
          onClick={handleShuffleAll}
        >
          🔀 Shuffle All
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-500 text-white"
          onClick={() =>
            setBrackets((prev) =>
              prev.map((b) => ({
                ...b,
                whitePlayer: undefined,
                blackPlayer: undefined,
              }))
            )
          }
        >
          🗑️ Clear All
        </Button>
      </div>

              {/* Start Tournament Button */}
        {brackets
          .filter((b) => b.round === 0)
          .every((b) => b.whitePlayer && b.blackPlayer) && (
          <div className="flex justify-center mb-8">
            <form action={formAction}>
              {(() => {
                const tournamentData = getTournamentData();
                return (
                  <>
                    <input type="hidden" name="tournamentName" value={tournamentData.tournamentName} />
                    <input type="hidden" name="tournamentSize" value={tournamentData.tournamentSize} />
                    <input type="hidden" name="matches" value={tournamentData.matches} />
                  </>
                );
              })()}
              <Button
                type="submit"
                size="lg"
                className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold px-8 py-3 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
              >
                {isPending ? "🔄 STARTING..." : "⚔️ START TOURNAMENT"}
              </Button>
            </form>
          </div>
        )}

        {/* Error Display */}
        {!actionState.output.success && actionState.output.error && (
          <div className="flex justify-center mb-8">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 max-w-md">
              <div className="text-red-400 text-sm font-medium">
                ❌ {actionState.output.error}
              </div>
            </div>
          </div>
        )}

      {/* Model Selection */}
      {selectedPosition && selectedSide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-600/50 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-4 h-4 rounded-sm border border-gray-400 ${
                  selectedSide === "white" ? "bg-white" : "bg-black"
                }`}
              ></div>
              <h3 className="text-yellow-400 font-bold text-lg">
                Select {selectedSide === "white" ? "White" : "Black"} Player
              </h3>
            </div>
            <ModelSelect
              label={`Choose your ${selectedSide} AI warrior`}
              items={mockModelOptions.filter(
                (model) =>
                  !brackets.some(
                    (bracket) =>
                      bracket.whitePlayer?.modelId === model.canonical_id ||
                      bracket.blackPlayer?.modelId === model.canonical_id
                  )
              )}
              value=""
              onChange={handlePlayerSelect}
              placeholder="Select a model..."
            />
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300"
                onClick={() => {
                  setSelectedPosition(null);
                  setSelectedSide(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
