"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { Chess } from "chess.js";
import { useParams } from "next/navigation";
import * as React from "react";
import { Chessboard, defaultPieces } from "react-chessboard";
import { Card } from "@/components/ui/card";
import { BattlesCollection, PlayersCollection } from "@/db/electric";
import { useCurrentMove } from "@/hooks/use-current-move";
import { useMoveIndex } from "@/hooks/use-move-index";
import { useMoves } from "@/hooks/use-moves";

export function ChessBoard() {
  const { battle_id } = useParams<{ battle_id: string }>();
  const {
    data: [battle],
  } = useLiveQuery((q) =>
    q
      .from({ battle: BattlesCollection })
      .leftJoin(
        { white_player: PlayersCollection },
        ({ battle, white_player }) =>
          eq(battle.white_player_id, white_player.id),
      )
      .leftJoin(
        { black_player: PlayersCollection },
        ({ battle, black_player }) =>
          eq(battle.black_player_id, black_player.id),
      )
      .where(({ battle }) => eq(battle.id, battle_id))
      .select(({ battle, white_player, black_player }) => ({
        ...battle,
        white_player,
        black_player,
      })),
  );

  // Create game over info from battle properties
  const gameOverInfo = React.useMemo(() => {
    if (!battle?.outcome) {
      return { over: false };
    }

    return {
      over: true,
      winner:
        battle.winner === "white"
          ? "White"
          : battle.winner === "black"
            ? "Black"
            : undefined,
      draw: battle.outcome === "draw",
    };
  }, [battle?.outcome, battle?.winner]);

  const currentMove = useCurrentMove();
  const { data: allMoves } = useMoves(battle_id);
  const { moveIndex } = useMoveIndex();

  const position = React.useMemo(() => {
    if (!currentMove) {
      return new Chess().fen();
    }
    return currentMove.state;
  }, [currentMove]);

  // Helper function to parse invalid moves manually
  const parseInvalidMove = React.useCallback(
    (moveStr: string, boardPosition?: string): { from: string; to: string } => {
      // Remove check/checkmate indicators and whitespace
      const cleanMove = moveStr.replace(/[+#\s]/g, "");

      // Handle castling - these are typically not invalid but just in case
      if (cleanMove === "O-O" || cleanMove === "0-0") {
        return { from: "", to: "" }; // We'll skip castling highlighting for now
      }
      if (cleanMove === "O-O-O" || cleanMove === "0-0-0") {
        return { from: "", to: "" }; // We'll skip castling highlighting for now
      }

      // Try to extract ALL square notations from the move string
      const allSquares = cleanMove.match(/[a-h][1-9]/g) || [];

      let fromSquare = "";
      let toSquare = "";

      // Handle moves with explicit from-to notation like "e2e4", "Nb1c3", "e2-e4"
      const explicitFromToMatch = cleanMove.match(
        /([a-h][1-9])[-]?([a-h][1-9])/,
      );
      if (explicitFromToMatch) {
        return { from: explicitFromToMatch[1], to: explicitFromToMatch[2] };
      }

      // Handle piece moves with disambiguation like "Nbd2", "R1a3", "Qh4e1"
      const pieceWithSquaresMatch = cleanMove.match(
        /^([NBRQK])([a-h]?[1-9]?)x?([a-h][1-9])/,
      );
      if (pieceWithSquaresMatch) {
        const piece = pieceWithSquaresMatch[1];
        const disambiguation = pieceWithSquaresMatch[2];
        const destination = pieceWithSquaresMatch[3];

        toSquare = destination;

        // Try to construct the from square if we have disambiguation
        if (disambiguation) {
          // Check if disambiguation is a full square
          if (disambiguation.match(/^[a-h][1-9]$/)) {
            fromSquare = disambiguation;
          } else if (disambiguation.match(/^[a-h]$/)) {
            // File disambiguation - try to guess rank based on piece type and destination
            const file = disambiguation;
            if (boardPosition) {
              // In a real implementation, we could analyze the board position here
              // For now, we'll make educated guesses
              fromSquare =
                file + (piece === "N" ? "1" : piece === "R" ? "1" : "2");
            }
          } else if (disambiguation.match(/^[1-9]$/)) {
            // Rank disambiguation - try to guess file
            const rank = disambiguation;
            if (destination) {
              const destFile = destination[0];
              // Make an educated guess for the file
              fromSquare = destFile + rank;
            }
          }
        }

        return { from: fromSquare, to: toSquare };
      }

      // Handle pawn moves like "e4", "exd5", "e2xd3"
      const pawnMatch = cleanMove.match(/^([a-h]?)([1-9]?)x?([a-h][1-9])/);
      if (pawnMatch) {
        const fromFile = pawnMatch[1];
        const fromRank = pawnMatch[2];
        const destination = pawnMatch[3];

        toSquare = destination;

        if (fromFile && fromRank) {
          // Full square specified
          fromSquare = fromFile + fromRank;
        } else if (fromFile && destination) {
          // For captures like "exd5", we know the file the pawn came from
          const destRank = parseInt(destination[1]);
          // Try different ranks - pawns typically move forward one square or capture diagonally
          const possibleFromRanks = [
            destRank - 1,
            destRank + 1,
            destRank - 2,
            destRank + 2,
          ];

          for (const rank of possibleFromRanks) {
            if (rank >= 1 && rank <= 8) {
              fromSquare = fromFile + rank;
              break;
            }
          }
        } else if (!fromFile && destination) {
          // For moves like "e4", try to guess the source square
          const destFile = destination[0];
          const destRank = parseInt(destination[1]);

          // For pawn pushes, the source is typically one or two squares behind
          const possibleFromRanks = [
            destRank - 1,
            destRank - 2,
            destRank + 1,
            destRank + 2,
          ];

          for (const rank of possibleFromRanks) {
            if (rank >= 1 && rank <= 8) {
              fromSquare = destFile + rank;
              break;
            }
          }
        }

        return { from: fromSquare, to: toSquare };
      }

      // If we found multiple squares in the move string, use them
      if (allSquares.length >= 2) {
        // Assume first is from, last is to
        fromSquare = allSquares[0] || "";
        toSquare = allSquares[allSquares.length - 1] || "";
      } else if (allSquares.length === 1) {
        // Only one square found, assume it's the destination
        toSquare = allSquares[0] || "";
      }

      // Final fallback: extract any square-like pattern even if invalid
      if (!toSquare) {
        const fallbackMatch = cleanMove.match(/[a-h][0-9]/);
        if (fallbackMatch) {
          toSquare = fallbackMatch[0];
        }
      }

      return { from: fromSquare, to: toSquare };
    },
    [],
  );

  // Calculate highlighted squares for the current move
  const squareStyles = React.useMemo(() => {
    if (!currentMove?.move) {
      return {};
    }

    const moveStr = currentMove.move;
    let fromSquare = "";
    let toSquare = "";

    try {
      if (currentMove.is_valid) {
        // For valid moves, use chess.js to get accurate from/to squares
        if (allMoves && moveIndex > 0) {
          // Reconstruct the game up to the previous move
          const tempChess = new Chess();
          const movesToReplay = allMoves.slice(0, moveIndex - 1);

          // Replay all valid moves up to the current position
          for (const move of movesToReplay) {
            if (move.is_valid && move.move) {
              try {
                tempChess.move(move.move);
              } catch (error) {
                console.warn("Error replaying move:", move.move, error);
              }
            }
          }

          // Get all possible moves in verbose format to find our move
          const possibleMoves = tempChess.moves({ verbose: true });
          const matchingMove = possibleMoves.find((m) => m.san === moveStr);

          if (matchingMove) {
            fromSquare = matchingMove.from;
            toSquare = matchingMove.to;
          }
        }
      } else {
        // For invalid moves, parse manually since chess.js can't help
        const boardPosition = position; // Pass current board position for context
        const parsedMove = parseInvalidMove(moveStr, boardPosition);
        fromSquare = parsedMove.from;
        toSquare = parsedMove.to;
      }

      // Color scheme based on validity with clear opacity difference
      const colors = currentMove.is_valid
        ? {
            // Valid moves: green theme
            // Origin square (lighter/less opacity)
            fromColor: "rgba(0, 255, 0, 0.15)",
            fromBorder: "2px solid rgba(0, 255, 0, 0.5)",
            fromShadow: "0 0 6px rgba(0, 255, 0, 0.3)",
            // Destination square (brighter/more opacity)
            toColor: "rgba(0, 255, 0, 0.45)",
            toBorder: "2px solid rgba(0, 255, 0, 0.9)",
            toShadow: "0 0 15px rgba(0, 255, 0, 0.7)",
          }
        : {
            // Invalid moves: red theme
            // Origin square (lighter/less opacity)
            fromColor: "rgba(255, 0, 0, 0.15)",
            fromBorder: "2px solid rgba(255, 0, 0, 0.5)",
            fromShadow: "0 0 6px rgba(255, 0, 0, 0.3)",
            // Destination square (brighter/more opacity)
            toColor: "rgba(255, 0, 0, 0.45)",
            toBorder: "2px solid rgba(255, 0, 0, 0.9)",
            toShadow: "0 0 15px rgba(255, 0, 0, 0.7)",
          };

      const styles: Record<string, React.CSSProperties> = {};

      // Highlight origin square (from) - LIGHTER opacity (0.15)
      if (fromSquare) {
        styles[fromSquare] = {
          background: colors.fromColor,
          border: colors.fromBorder,
          boxShadow: colors.fromShadow,
        };
      }

      // Highlight destination square (to) - STRONGER opacity (0.45), more prominent
      if (toSquare) {
        styles[toSquare] = {
          background: colors.toColor,
          border: colors.toBorder,
          boxShadow: colors.toShadow,
        };
      }

      return styles;
    } catch (error) {
      console.warn("Error parsing move for highlighting:", error);
      return {};
    }
  }, [currentMove, allMoves, moveIndex, position, parseInvalidMove]);

  // Terminal-themed custom pieces: add green glow/border to black pieces
  const terminalPieces = {
    ...defaultPieces,
    bP: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bP({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bR: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bR({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bN: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bN({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bB: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bB({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bQ: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bQ({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
    bK: (props?: { fill?: string; svgStyle?: React.CSSProperties }) =>
      defaultPieces.bK({
        ...props,
        svgStyle: {
          ...(props?.svgStyle ?? {}),
          filter: "drop-shadow(0 0 4px rgba(0,255,0,0.9))",
        },
      }),
  };

  return (
    <Card
      className={`terminal-card terminal-border p-4 ${gameOverInfo?.over ? "ring-2 ring-yellow-400/50" : ""}`}
    >
      <div className="w-full max-w-md relative">
        <Chessboard
          key={position}
          options={{
            position,
            allowDragging: false,
            showNotation: true,
            id: "terminal-board",
            pieces: terminalPieces,
            squareStyles,
            boardStyle: {
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: gameOverInfo?.over
                ? "0 0 20px rgba(255, 215, 0, 0.3)"
                : "0 0 15px rgba(8, 255, 8, 0.2)",
            },
            lightSquareStyle: {
              background: "var(--card)",
              boxShadow: "0 0 15px rgba(8, 255, 8, 0.2)",
            },
            darkSquareStyle: {
              background: "var(--secondary)",
              boxShadow: "0 0 15px rgba(8, 255, 8, 0.2)",
            },
            dropSquareStyle: {
              background: "rgba(1, 255, 0, 0.08)",
              boxShadow: "inset 0 0 0 2px var(--ring)",
            },
            darkSquareNotationStyle: {
              color: "var(--foreground)",
              textShadow: "0 0 5px var(--foreground)",
              fontFamily: "'Courier New', monospace",
              opacity: 0.9,
            },
            lightSquareNotationStyle: {
              color: "var(--foreground)",
              textShadow: "0 0 5px var(--foreground)",
              fontFamily: "'Courier New', monospace",
              opacity: 0.9,
            },
            alphaNotationStyle: {
              color: "var(--foreground)",
              textShadow: "0 0 5px var(--foreground)",
              fontFamily: "'Courier New', monospace",
              opacity: 0.8,
            },
            numericNotationStyle: {
              color: "var(--foreground)",
              textShadow: "0 0 5px var(--foreground)",
              fontFamily: "'Courier New', monospace",
              opacity: 0.7,
            },
          }}
        />
        {gameOverInfo?.over && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-yellow-400/20 border border-yellow-400/50 rounded px-2 py-1">
              <div className="terminal-text text-xs text-yellow-400 font-mono">
                GAME_COMPLETE
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
