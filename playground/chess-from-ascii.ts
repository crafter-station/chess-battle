import { Chess } from "chess.js";

const board = await Bun.file("chess.txt").text();

const chess = new Chess(board);

console.log(chess.ascii());
console.log(chess.moves());
