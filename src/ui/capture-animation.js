import { cloneGrid } from '../engine/board.js';
import { renderBoard } from './board-view.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rebuilds the board grid as it should look after "capturesDone" jumps of
// the sequence, starting from the grid state before the whole move.
function buildStepGrid(beforeGrid, move, capturesDone) {
  const grid = cloneGrid(beforeGrid);
  const piece = grid[move.from.row][move.from.col];
  grid[move.from.row][move.from.col] = null;

  for (let i = 0; i < capturesDone; i++) {
    const cap = move.captures[i];
    grid[cap.row][cap.col] = null;
  }

  const position = move.path[capturesDone];
  const isFinalStep = capturesDone === move.captures.length;
  const king = piece.king || (isFinalStep && move.promoted);
  grid[position.row][position.col] = { color: piece.color, king };

  return grid;
}

// Plays a multi-capture sequence one jump at a time: highlights the
// attacking piece, shows the full planned path, stops after each capture
// and removes the captured piece, then pauses before the next jump.
export async function playCaptureAnimation(boardEl, beforeGrid, move, options = {}) {
  const stepDelay = options.stepDelay || 1200;
  if (!move.isCapture || move.captures.length < 2) return;

  for (let step = 1; step <= move.captures.length; step++) {
    const grid = buildStepGrid(beforeGrid, move, step);
    const position = move.path[step];
    renderBoard(boardEl, { grid }, {
      interactive: false,
      capturePath: move.path,
      animatingSquare: position,
    });
    await delay(stepDelay);
  }
}
