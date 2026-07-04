import { SIZE, forEachPiece } from './board.js';
import { generateLegalMoves } from './moves.js';
import { applyMove, isGameOver } from './rules.js';

const MAN_VALUE = 100;
const KING_VALUE = 350;
const ADVANCE_WEIGHT = 4; // rewards men marching toward promotion
const CENTER_WEIGHT = 2; // rewards central board control
const WIN_SCORE = 1_000_000;

export const DIFFICULTY_LEVELS = {
  1: { label: 'Débutant', depth: 2, randomize: true },
  2: { label: 'Facile', depth: 4, randomize: false },
  3: { label: 'Intermédiaire', depth: 6, randomize: false },
  4: { label: 'Expert', depth: 8, randomize: false, timeLimitMs: 4000 },
};

function evaluate(state, aiColor) {
  if (state.winner === aiColor) return WIN_SCORE;
  if (state.winner && state.winner !== aiColor) return -WIN_SCORE;
  if (state.drawReason) return 0;

  let score = 0;
  forEachPiece(state.grid, (piece, row, col) => {
    const sign = piece.color === aiColor ? 1 : -1;
    let value = piece.king ? KING_VALUE : MAN_VALUE;

    if (!piece.king) {
      const progress = piece.color === 'W' ? row : SIZE - 1 - row;
      value += progress * ADVANCE_WEIGHT;
    }

    const centerDistance = Math.abs(col - (SIZE - 1) / 2);
    value += ((SIZE - 1) / 2 - centerDistance) * CENTER_WEIGHT;

    score += sign * value;
  });

  return score;
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => b.captures.length - a.captures.length);
}

function minimax(state, depth, alpha, beta, aiColor, deadline) {
  if (depth === 0 || isGameOver(state) || (deadline && Date.now() > deadline)) {
    return { score: evaluate(state, aiColor), move: null };
  }

  const moves = orderMoves(generateLegalMoves(state));
  const maximizing = state.turn === aiColor;
  let bestMove = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = applyMove(state, move);
    const { score } = minimax(next, depth - 1, alpha, beta, aiColor, deadline);

    if (maximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break;
  }

  return { score: bestScore, move: bestMove };
}

/**
 * Picks a move for the side to move at the given difficulty level (1-4).
 */
export function chooseAiMove(state, level) {
  const config = DIFFICULTY_LEVELS[level] ?? DIFFICULTY_LEVELS[2];
  const aiColor = state.turn;
  const moves = orderMoves(generateLegalMoves(state));
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const deadline = config.timeLimitMs ? Date.now() + config.timeLimitMs : null;

  if (!config.randomize) {
    const { move } = minimax(state, config.depth, -Infinity, Infinity, aiColor, deadline);
    return move ?? moves[0];
  }

  // Weaker levels: evaluate every candidate move, then pick randomly among
  // those within a margin of the best score so play is beatable, not just shallow.
  const scored = moves.map((move) => {
    const next = applyMove(state, move);
    const { score } = minimax(next, Math.max(config.depth - 1, 0), -Infinity, Infinity, aiColor, deadline);
    return { move, score };
  });
  const best = Math.max(...scored.map((s) => s.score));
  const margin = 60;
  const candidates = scored.filter((s) => s.score >= best - margin);
  return candidates[Math.floor(Math.random() * candidates.length)].move;
}
