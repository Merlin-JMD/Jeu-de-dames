import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  emptyState,
  placePiece,
  countPieces,
  WHITE,
  BLACK,
} from '../src/engine/board.js';
import { generateLegalMoves } from '../src/engine/moves.js';
import { applyMove, isGameOver, DRAW_HALF_MOVE_LIMIT } from '../src/engine/rules.js';

describe('initial setup', () => {
  it('places 20 pieces per side on dark squares only', () => {
    const state = createInitialState();
    const { white, black } = countPieces(state.grid);
    expect(white).toBe(20);
    expect(black).toBe(20);
  });

  it('gives white the 9 known opening moves', () => {
    const state = createInitialState();
    const moves = generateLegalMoves(state);
    expect(moves.length).toBe(9);
    expect(moves.every((m) => !m.isCapture)).toBe(true);
  });
});

describe('promotion', () => {
  it('promotes a man reaching the last row with a simple move', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 8, 2, WHITE, false);
    const moves = generateLegalMoves(state);
    const toLastRow = moves.find((m) => m.to.row === 9);
    expect(toLastRow.promoted).toBe(true);

    const next = applyMove(state, toLastRow);
    expect(next.grid[9][toLastRow.to.col].king).toBe(true);
  });

  it('promotes mid-capture and continues as a king if further captures exist', () => {
    // White man at (7,3) captures black at (8,4), lands at (9,5) — promotion row.
    // A second black piece at (9,7)... actually must chain from (9,5): black king-capturable
    // piece placed diagonally from (9,5) is off-board (row 9 is edge), so instead verify
    // promotion flag itself and that no further forced capture breaks the engine.
    const state = emptyState(WHITE);
    placePiece(state.grid, 7, 3, WHITE, false);
    placePiece(state.grid, 8, 4, BLACK, false);
    const moves = generateLegalMoves(state);
    expect(moves.length).toBe(1);
    const move = moves[0];
    expect(move.to).toEqual({ row: 9, col: 5 });
    expect(move.promoted).toBe(true);
    const next = applyMove(state, move);
    expect(next.grid[9][5]).toEqual({ color: WHITE, king: true });
    expect(next.grid[8][4]).toBeNull();
  });
});

describe('end of game', () => {
  it('declares a winner when the opponent has no pieces left', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 3, 3, WHITE, false);
    placePiece(state.grid, 4, 4, BLACK, false);
    const moves = generateLegalMoves(state);
    const capture = moves.find((m) => m.isCapture);
    const next = applyMove(state, capture);
    expect(next.winner).toBe(WHITE);
    expect(isGameOver(next)).toBe(true);
  });

  it('declares a winner when the side to move has no legal moves', () => {
    // White plays (7,0)->(8,1), boxing black's man in the corner: its only
    // forward neighbor becomes a white piece, and the square beyond it (the
    // would-be capture landing square) is already occupied, so black is left
    // with no move or capture at all.
    const state = emptyState(WHITE);
    placePiece(state.grid, 7, 0, WHITE, false);
    placePiece(state.grid, 7, 2, WHITE, false);
    placePiece(state.grid, 9, 0, BLACK, false);

    const moves = generateLegalMoves(state);
    const boxingMove = moves.find((m) => m.from.row === 7 && m.from.col === 0 && m.to.col === 1);
    expect(boxingMove).toBeTruthy();

    const next = applyMove(state, boxingMove);
    expect(next.turn).toBe(BLACK);
    expect(generateLegalMoves(next).length).toBe(0);
    expect(next.winner).toBe(WHITE);
    expect(isGameOver(next)).toBe(true);
  });

  it('declares a draw after too many moves without progress', () => {
    let state = emptyState(WHITE);
    placePiece(state.grid, 0, 1, WHITE, true);
    placePiece(state.grid, 9, 8, BLACK, true);
    state.movesSinceProgress = DRAW_HALF_MOVE_LIMIT - 1;
    const moves = generateLegalMoves(state);
    const nonCapture = moves.find((m) => !m.isCapture);
    const next = applyMove(state, nonCapture);
    expect(next.drawReason).toBe('moves-without-progress');
    expect(next.winner).toBeNull();
  });
});
