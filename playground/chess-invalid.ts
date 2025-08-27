import { Chess } from "chess.js";

const chess = new Chess();

chess.move("e4");
chess.move("e5");

const move = "e6";

console.log(chess.moves());

try {
  chess.move(move);
} catch (error) {
  console.log(error instanceof Error ? error.message : "Unknown error");
}

console.log(chess.ascii());

/* ➜  chess-battle git:(main) ✗ bun run playground/chess-invalid.ts
Invalid move: e6
   +------------------------+
 8 | r  n  b  q  k  b  n  r |
 7 | p  p  p  p  .  p  p  p |
 6 | .  .  .  .  .  .  .  . |
 5 | .  .  .  .  p  .  .  . |
 4 | .  .  .  .  P  .  .  . |
 3 | .  .  .  .  .  .  .  . |
 2 | P  P  P  P  .  P  P  P |
 1 | R  N  B  Q  K  B  N  R |
   +------------------------+
     a  b  c  d  e  f  g  h */
