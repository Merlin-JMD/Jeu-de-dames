import { cloneGrid, countPieces, otherColor, WHITE, BLACK } from './board.js';
import { generateLegalMoves } from './moves.js';

// Simplified FMJD draw rule: 25 moves per side (50 half-moves) without a
// capture or a man advancing ends the game in a draw. Position-repetition
// detection is intentionally out of scope for v1.
export const DRAW_HALF_MOVE_LIMIT = 50;

export function applyMove(state, move) {
  const grid = cloneGrid(state.grid);
  const piece = grid[move.from.row][move.from.col];
  grid[move.from.row][move.from.col] = null;

  for (const cap of move.captures) {
    grid[cap.row][cap.col] = null;
  }

  const finalKing = piece.king || move.promoted;
  grid[move.to.row][move.to.col] = { color: piece.color, king: finalKing };

  const progressed = move.isCapture || !piece.king;
  const movesSinceProgress = progressed ? 0 : state.movesSinceProgress + 1;

  const nextState = {
    grid,
    turn: otherColor(state.turn),
    movesSinceProgress,
    winner: null,
    drawReason: null,
  };

  return finalizeState(nextState);
}

function finalizeState(state) {
  const { white, black } = countPieces(state.grid);

  if (white === 0) return { ...state, winner: BLACK };
  if (black === 0) return { ...state, winner: WHITE };
  if (generateLegalMoves(state).length === 0) {
    return { ...state, winner: otherColor(state.turn) };
  }
  if (state.movesSinceProgress >= DRAW_HALF_MOVE_LIMIT && !state.pendingDraw) {
    return { ...state, pendingDraw: true };
  }

  return state;
}

// Called when the human accepts the draw offered at the 25-move limit.
export function confirmDraw(state) {
  return { ...state, pendingDraw: false, winner: null, drawReason: 'moves-without-progress' };
}

// Called when the human resigns instead of accepting the draw.
export function resign(state, resigningColor) {
  return { ...state, pendingDraw: false, winner: otherColor(resigningColor), drawReason: null };
}

export function isGameOver(state) {
  return state.winner !== null || state.drawReason !== null;
}

export function legalMovesFrom(state, row, col) {
  return generateLegalMoves(state).filter((m) => m.from.row === row && m.from.col === col);
}

export function piecesWithLegalMoves(state) {
  const moves = generateLegalMoves(state);
  const squares = new Set(moves.map((m) => `${m.from.row},${m.from.col}`));
  return squares;
}
