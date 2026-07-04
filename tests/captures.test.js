import { describe, it, expect } from 'vitest';
import { emptyState, placePiece, WHITE, BLACK } from '../src/engine/board.js';
import { generateLegalMoves } from '../src/engine/moves.js';
import { applyMove } from '../src/engine/rules.js';

function findMoveTo(moves, row, col) {
  return moves.find((m) => m.to.row === row && m.to.col === col);
}

describe('mandatory capture', () => {
  it('forces a capture even when a non-capturing piece could otherwise move', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 3, 3, WHITE, false); // can capture
    placePiece(state.grid, 4, 4, BLACK, false);
    placePiece(state.grid, 0, 2, WHITE, false); // could otherwise move freely

    const moves = generateLegalMoves(state);
    expect(moves.length).toBe(1);
    expect(moves[0].isCapture).toBe(true);
    expect(moves[0].from).toEqual({ row: 3, col: 3 });
  });

  it('allows a man to capture backward', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 5, 5, WHITE, false);
    placePiece(state.grid, 4, 4, BLACK, false); // behind white's forward direction

    const moves = generateLegalMoves(state);
    expect(moves.length).toBe(1);
    expect(moves[0].to).toEqual({ row: 3, col: 3 });
  });

  it('blocks a capture when the landing square is occupied', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 3, 3, WHITE, false);
    placePiece(state.grid, 4, 4, BLACK, false);
    placePiece(state.grid, 5, 5, BLACK, false); // occupies the landing square

    const moves = generateLegalMoves(state);
    expect(moves.some((m) => m.isCapture)).toBe(false);
  });
});

describe('majority capture rule', () => {
  it('only allows the sequence capturing the most pieces', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 2, 2, WHITE, false);
    // Long branch: (2,2) -> capture (3,3) -> land (4,4) -> capture (5,5) -> land (6,6)
    placePiece(state.grid, 3, 3, BLACK, false);
    placePiece(state.grid, 5, 5, BLACK, false);
    // Short branch: (2,2) -> capture (1,1) -> land (0,0)
    placePiece(state.grid, 1, 1, BLACK, false);

    const moves = generateLegalMoves(state);
    expect(moves.length).toBe(1);
    expect(moves[0].captures.length).toBe(2);
    expect(moves[0].to).toEqual({ row: 6, col: 6 });
  });

  it('excludes shorter alternative capture branches entirely', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 4, 4, WHITE, false);
    // Branch A: single capture going one way
    placePiece(state.grid, 3, 3, BLACK, false);
    // Branch B: two captures going the other way
    placePiece(state.grid, 5, 5, BLACK, false);
    placePiece(state.grid, 7, 7, BLACK, false);

    const moves = generateLegalMoves(state);
    // Only the 2-capture branch (via 5,5 then 7,7) should remain.
    expect(moves.every((m) => m.captures.length === 2)).toBe(true);
  });
});

describe('multi-jump chains', () => {
  it('chains two consecutive man captures in one turn', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 1, 1, WHITE, false);
    placePiece(state.grid, 2, 2, BLACK, false);
    placePiece(state.grid, 4, 4, BLACK, false);

    const moves = generateLegalMoves(state);
    expect(moves.length).toBe(1);
    const move = moves[0];
    expect(move.captures.length).toBe(2);
    expect(move.to).toEqual({ row: 5, col: 5 });

    const next = applyMove(state, move);
    expect(next.grid[2][2]).toBeNull();
    expect(next.grid[4][4]).toBeNull();
    expect(next.grid[5][5]).toEqual({ color: WHITE, king: false });
  });
});

describe('flying king captures', () => {
  it('captures a distant piece and can land on any empty square beyond it', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 0, 1, WHITE, true);
    placePiece(state.grid, 4, 5, BLACK, false);

    const moves = generateLegalMoves(state);
    const landingSquares = moves.map((m) => `${m.to.row},${m.to.col}`).sort();
    expect(landingSquares).toEqual(['5,6', '6,7', '7,8', '8,9']);
    expect(moves.every((m) => m.captures.length === 1)).toBe(true);
  });

  it('does not allow jumping two pieces in a row without a landing gap', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 0, 1, WHITE, true);
    placePiece(state.grid, 3, 4, BLACK, false);
    placePiece(state.grid, 4, 5, BLACK, false); // no empty square between the two

    const moves = generateLegalMoves(state);
    expect(moves.some((m) => m.isCapture)).toBe(false);
  });

  it('chains a multi-king capture, changing direction mid-sequence (regression for the historical mobile multi-king bug)', () => {
    const state = emptyState(WHITE);
    placePiece(state.grid, 0, 1, WHITE, true);
    placePiece(state.grid, 3, 4, BLACK, true);
    placePiece(state.grid, 6, 3, BLACK, true);

    const moves = generateLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => m.captures.length === 2)).toBe(true);

    const move = findMoveTo(moves, 9, 0);
    expect(move).toBeTruthy();

    const next = applyMove(state, move);
    expect(next.grid[3][4]).toBeNull();
    expect(next.grid[6][3]).toBeNull();
    expect(next.grid[9][0]).toEqual({ color: WHITE, king: true });
  });
});
