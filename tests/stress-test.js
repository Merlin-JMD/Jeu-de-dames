// Node stress test: simulates N full games of random-but-legal play to shake
// out crashes or invalid states in the rules engine, in the same spirit as
// the 500-game Node.js stress test that validated the previous chess/checkers
// prototype's multi-king capture logic. Run with: npm run stress-test [N]
import { createInitialState, countPieces, isDarkSquare } from '../src/engine/board.js';
import { generateLegalMoves } from '../src/engine/moves.js';
import { applyMove, isGameOver } from '../src/engine/rules.js';

const GAME_COUNT = Number(process.argv[2]) || 500;
const MAX_PLIES = 1000; // safety net; the draw rule should end games well before this

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function assertInvariants(prev, move, next, gameIndex, ply) {
  const prevCount = countPieces(prev.grid);
  const nextCount = countPieces(next.grid);
  const prevTotal = prevCount.white + prevCount.black;
  const nextTotal = nextCount.white + nextCount.black;

  if (nextTotal > prevTotal) {
    throw new Error(`game ${gameIndex} ply ${ply}: piece count increased (${prevTotal} -> ${nextTotal})`);
  }
  if (nextTotal !== prevTotal - move.captures.length) {
    throw new Error(
      `game ${gameIndex} ply ${ply}: expected to lose exactly ${move.captures.length} piece(s), lost ${
        prevTotal - nextTotal
      }`
    );
  }

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (next.grid[row][col] && !isDarkSquare(row, col)) {
        throw new Error(`game ${gameIndex} ply ${ply}: piece landed on a light square (${row},${col})`);
      }
    }
  }
}

function playRandomGame(gameIndex) {
  let state = createInitialState();
  let ply = 0;
  let maxChain = 0;

  while (!isGameOver(state) && ply < MAX_PLIES) {
    const moves = generateLegalMoves(state);
    if (moves.length === 0) {
      throw new Error(`game ${gameIndex} ply ${ply}: no legal moves but isGameOver() was false`);
    }

    const move = randomChoice(moves);
    maxChain = Math.max(maxChain, move.captures.length);

    const next = applyMove(state, move);
    assertInvariants(state, move, next, gameIndex, ply);

    state = next;
    ply++;
  }

  if (ply >= MAX_PLIES) {
    throw new Error(`game ${gameIndex}: exceeded ${MAX_PLIES} plies without reaching a game-over state`);
  }

  return { winner: state.winner, drawReason: state.drawReason, plies: ply, maxChain };
}

function main() {
  const results = { W: 0, B: 0, draw: 0 };
  let longestGame = 0;
  let biggestChain = 0;
  let chainOf3Plus = 0;

  for (let i = 0; i < GAME_COUNT; i++) {
    const result = playRandomGame(i);
    if (result.winner) results[result.winner]++;
    else results.draw++;
    longestGame = Math.max(longestGame, result.plies);
    biggestChain = Math.max(biggestChain, result.maxChain);
    if (result.maxChain >= 3) chainOf3Plus++;
  }

  console.log(`Simulated ${GAME_COUNT} games.`);
  console.log(`  White wins: ${results.W}`);
  console.log(`  Black wins: ${results.B}`);
  console.log(`  Draws: ${results.draw}`);
  console.log(`  Longest game: ${longestGame} plies`);
  console.log(`  Biggest single capture chain: ${biggestChain} piece(s)`);
  console.log(`  Games with a 3+ piece capture chain: ${chainOf3Plus}`);
  console.log('All invariants held (no crashes, no invalid board states).');
}

main();
