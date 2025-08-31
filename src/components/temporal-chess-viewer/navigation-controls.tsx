"use client";

import { useParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useMoveIndex } from "@/hooks/use-move-index";
import { useMoves } from "@/hooks/use-moves";
import { useAudio } from "@/hooks/use-audio";

export function NavigationControls() {
  const { battle_id } = useParams<{ battle_id: string }>();
  const { data: moves } = useMoves(battle_id);
  const { moveIndex, setMoveIndex } = useMoveIndex();
  const [soundEnabled, setSoundEnabled] = React.useState(false);
  const { ensureAudio, playBeep } = useAudio();

  // Multi-digit number input state
  const [numberBuffer, setNumberBuffer] = React.useState("");
  const [showNumberInput, setShowNumberInput] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Simple navigation functions
  const goToStart = React.useCallback(() => {
    setMoveIndex(0);
    playBeep(560, 80, 0.12);
  }, [setMoveIndex, playBeep]);

  const goToPreviousMove = React.useCallback(() => {
    const previousIndex = Math.max(0, moveIndex - 1);
    setMoveIndex(previousIndex);
    const previousMove = moves[previousIndex - 1];
    if (previousMove?.is_valid) {
      playBeep(560, 80, 0.12);
    } else {
      playBeep(100, 90, 0.8);
    }
  }, [setMoveIndex, playBeep, moveIndex, moves]);

  const goToNextMove = React.useCallback(() => {
    const nextIndex = Math.min(moves.length, moveIndex + 1);
    setMoveIndex(nextIndex === moves.length ? null : nextIndex);
    const nextMove = moves[nextIndex - 1];
    if (nextMove?.is_valid) {
      playBeep(560, 80, 0.12);
    } else {
      playBeep(100, 90, 0.8);
    }
  }, [setMoveIndex, moves, playBeep, moveIndex]);

  const goToEnd = React.useCallback(() => {
    setMoveIndex(null);
    playBeep(560, 80, 0.12);
  }, [setMoveIndex, playBeep]);

  const goToMove = React.useCallback(
    (index: number) => {
      const targetIndex = Math.max(0, Math.min(moves.length, index));
      setMoveIndex(targetIndex);

      const targetMove = moves[targetIndex - 1];
      if (targetMove?.is_valid) {
        playBeep(560, 80, 0.12);
      } else {
        playBeep(100, 90, 0.8);
      }
    },
    [setMoveIndex, playBeep, moves]
  );

  // Clear number input buffer and hide indicator
  const clearNumberBuffer = React.useCallback(() => {
    setNumberBuffer("");
    setShowNumberInput(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Execute navigation to the buffered number
  const executeNumberNavigation = React.useCallback(() => {
    if (numberBuffer) {
      const targetMove = parseInt(numberBuffer, 10);
      goToMove(targetMove);
    }
    clearNumberBuffer();
  }, [numberBuffer, goToMove, clearNumberBuffer]);

  // Add digit to buffer with debounce
  const addDigitToBuffer = React.useCallback(
    (digit: string) => {
      setNumberBuffer((prev) => {
        const newBuffer = prev + digit;
        // Limit to reasonable number of digits (e.g., 4 digits = up to 9999)
        return newBuffer.length <= 4 ? newBuffer : prev;
      });
      setShowNumberInput(true);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer to execute navigation after 1.5 seconds of inactivity
      debounceTimerRef.current = setTimeout(() => {
        executeNumberNavigation();
      }, 1500);
    },
    [executeNumberNavigation]
  );

  const progressPercentage =
    moves.length > 1 ? (moveIndex / moves.length) * 100 : 0;

  const handleToggleSound = async () => {
    await ensureAudio();
    setSoundEnabled(!soundEnabled);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for navigation keys
      const isNavigationKey =
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
          "Escape",
          "Enter",
        ].includes(event.key) ||
        (event.key >= "0" && event.key <= "9");

      if (!isNavigationKey) return;

      // Don't interfere if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          clearNumberBuffer(); // Clear any pending number input
          goToPreviousMove();
          break;
        case "ArrowRight":
        case "ArrowDown":
          clearNumberBuffer(); // Clear any pending number input
          goToNextMove();
          break;
        case "Home":
          clearNumberBuffer(); // Clear any pending number input
          goToStart();
          break;
        case "End":
          clearNumberBuffer(); // Clear any pending number input
          goToEnd();
          break;
        case "Escape":
          clearNumberBuffer(); // Allow user to cancel number input
          break;
        case "Enter":
          executeNumberNavigation(); // Allow user to immediately execute
          break;
        default:
          // Handle number keys (0-9) with debounce
          if (event.key >= "0" && event.key <= "9") {
            addDigitToBuffer(event.key);
          }
          break;
      }
    };

    // Add event listener to document for global keyboard navigation
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    goToStart,
    goToPreviousMove,
    goToNextMove,
    goToEnd,
    clearNumberBuffer,
    executeNumberNavigation,
    addDigitToBuffer,
  ]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Card className="terminal-card terminal-border">
      <CardHeader>
        <CardTitle className="terminal-text text-sm">NAVIGATION</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={goToStart}
            disabled={moveIndex === 0}
            variant="outline"
            className="terminal-button terminal-text"
          >
            START
          </Button>
          <Button
            onClick={goToEnd}
            disabled={moveIndex === moves.length}
            variant="outline"
            className="terminal-button terminal-text"
          >
            END
          </Button>
          <Button
            onClick={goToPreviousMove}
            disabled={moveIndex === 0}
            variant="outline"
            className="terminal-button terminal-text"
          >
            ⬅️ PREV
          </Button>
          <Button
            onClick={goToNextMove}
            disabled={moveIndex === moves.length}
            variant="outline"
            className="terminal-button terminal-text"
          >
            NEXT ➡️
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs terminal-text opacity-70">
            <span>POS: {String(moveIndex).padStart(3, "0")}</span>
            <span>
              END: {String(Math.max(0, moves.length)).padStart(3, "0")}
            </span>
          </div>
          {showNumberInput && (
            <div className="text-center text-sm terminal-text bg-blue-900/20 border border-blue-500/30 rounded px-2 py-1">
              <span className="opacity-70">Jump to: </span>
              <span className="font-mono text-blue-400">{numberBuffer}</span>
              <span className="opacity-50 text-xs ml-2">
                (Enter to go, Esc to cancel)
              </span>
            </div>
          )}
          <Progress value={progressPercentage} className="h-2" />

          <div className="flex items-center justify-between text-xs">
            <span className="terminal-text opacity-70">SOUND</span>
            <Button
              type="button"
              onClick={handleToggleSound}
              variant={soundEnabled ? "default" : "outline"}
              className="terminal-button terminal-text px-3 py-1"
            >
              {soundEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <div className="terminal-text text-xs opacity-60 text-center space-y-1">
          <div>← → ↑ ↓ Arrow keys for navigation</div>
          <div>Type number + Enter to jump to move (e.g. 25)</div>
          <div>Home/End for start/end • Esc to cancel</div>
        </div>
      </CardContent>
    </Card>
  );
}
