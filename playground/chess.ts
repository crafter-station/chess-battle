import { Chess } from "chess.js";

const chess = new Chess();

chess.board().map((row) => row.map((cell) => cell?.type));

console.log(chess.fen());

chess.move({ from: "e2", to: "e4" });

console.log(chess.fen());

await Bun.write("chess.txt", chess.fen());
