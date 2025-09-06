"use client";

import { useParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { useAudio } from "@/hooks/use-audio";
import { useMoveIndex } from "@/hooks/use-move-index";
import { useMoves } from "@/hooks/use-moves";

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
    [setMoveIndex, playBeep, moves],
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
    [executeNumberNavigation],
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
    <div className="space-y-3">
      <div className="terminal-text text-xs terminal-glow font-mono opacity-70">
        NAVIGATION
      </div>

      <div className="grid grid-cols-4 gap-1">
        <Button
          onClick={goToStart}
          disabled={moveIndex === 0}
          variant="outline"
          size="sm"
          className="terminal-button terminal-text text-xs font-mono px-2 py-1 h-8"
        >
          START
        </Button>
        <Button
          onClick={goToPreviousMove}
          disabled={moveIndex === 0}
          variant="outline"
          size="sm"
          className="terminal-button terminal-text text-xs font-mono px-2 py-1 h-8"
        >
          ⬅ PREV
        </Button>
        <Button
          onClick={goToNextMove}
          disabled={moveIndex === moves.length}
          variant="outline"
          size="sm"
          className="terminal-button terminal-text text-xs font-mono px-2 py-1 h-8"
        >
          NEXT ➡
        </Button>
        <Button
          onClick={goToEnd}
          disabled={moveIndex === moves.length}
          variant="outline"
          size="sm"
          className="terminal-button terminal-text text-xs font-mono px-2 py-1 h-8"
        >
          END
        </Button>
      </div>

      <div className="space-y-2">
        {showNumberInput && (
          <div className="text-center text-xs terminal-text bg-blue-900/20 border border-blue-500/30 rounded px-2 py-1">
            <span className="opacity-70">Jump: </span>
            <span className="font-mono text-blue-400">{numberBuffer}</span>
            <span className="opacity-50 text-[10px] ml-1">(Enter/Esc)</span>
          </div>
        )}

        <Progress value={progressPercentage} className="h-1.5" />

        <div className="flex items-center justify-between text-xs">
          <span className="terminal-text opacity-70 font-mono">
            {String(moveIndex).padStart(2, "0")}/
            {String(Math.max(0, moves.length)).padStart(2, "0")}
          </span>
          <Button
            type="button"
            onClick={handleToggleSound}
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            className="terminal-button terminal-text text-xs font-mono px-2 py-1 h-6"
          >
            🔊 {soundEnabled ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      <div className="terminal-text text-[10px] opacity-60 text-center">
        <div>← → Arrow keys • Type number + Enter</div>
        <div>Home/End • Esc to cancel</div>
      </div>
    </div>
  );
}
