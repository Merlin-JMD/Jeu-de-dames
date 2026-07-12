import { renderBoard, squareFromPoint } from './board-view.js';

const DRAG_THRESHOLD = 6;

function squareEq(a, b) {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

/**
 * Pointer-events-based drag-and-drop (also supports tap-to-select then
 * tap-to-move). Using the unified Pointer Events API with pointer capture,
 * instead of separate mouse/touch listeners, is what keeps multi-square king
 * drags reliable on touch devices.
 */
export function createBoardController(boardEl, { onMove, onBlockedPiece }) {
  let state = null;
  let legalMoves = [];
  let interactive = false;
  let lastMove = null;

  let selected = null;
  let destinations = [];

  let pointerId = null;
  let originSquare = null;
  let startX = 0;
  let startY = 0;
  let ghostEl = null;
  let dragging = false;

  function render() {
    const pathSquares = selected ? pathSquaresFrom(selected) : [];
    renderBoard(boardEl, state, { selected, destinations, pathSquares, lastMove, interactive });
  }

  function destinationsFrom(square) {
    return legalMoves.filter((m) => squareEq(m.from, square)).map((m) => m.to);
  }

  function pathSquaresFrom(square) {
    const squares = [];
    const seen = new Set();
    const moves = legalMoves.filter((m) => squareEq(m.from, square));
    for (const m of moves) {
      const path = m.path && m.path.length ? m.path : [m.to];
      for (const p of path) {
        if (squareEq(p, square)) continue;
        const key = `,`;
        if (!seen.has(key)) {
          seen.add(key);
          squares.push(p);
        }
      }
    }
    return squares;
  }

  function findMove(from, to) {
    return legalMoves.find((m) => squareEq(m.from, from) && squareEq(m.to, to));
  }

  function clearSelection() {
    selected = null;
    destinations = [];
  }

  function removeGhost() {
    if (ghostEl) {
      ghostEl.remove();
      ghostEl = null;
    }
    boardEl.classList.remove('board--dragging');
  }

  function createGhost(square) {
    const rect = boardEl.getBoundingClientRect();
    const cellSize = rect.width / 10;
    const pieceData = state.grid[square.row][square.col];
    ghostEl = document.createElement('div');
    ghostEl.className = `piece piece--ghost piece--${pieceData.color === 'W' ? 'white' : 'black'}${
      pieceData.king ? ' piece--king' : ''
    }`;
    ghostEl.style.width = `${cellSize}px`;
    ghostEl.style.height = `${cellSize}px`;
    document.body.appendChild(ghostEl);
    boardEl.classList.add('board--dragging');

    const originalPieceEl = boardEl.querySelector(`.piece[data-row="${square.row}"][data-col="${square.col}"]`);
    if (originalPieceEl) originalPieceEl.style.visibility = 'hidden';
  }

  function moveGhost(clientX, clientY) {
    if (!ghostEl) return;
    const size = parseFloat(ghostEl.style.width);
    ghostEl.style.left = `${clientX - size / 2}px`;
    ghostEl.style.top = `${clientY - size / 2}px`;
  }

  function handleBlockedClick(square) {
    clearSelection();
    render();
    const pieceHere = state.grid[square.row][square.col];
    const mustCapture = legalMoves.length > 0 && legalMoves[0].isCapture;
    if (pieceHere && pieceHere.color === state.turn && mustCapture) {
      if (onBlockedPiece) onBlockedPiece();
      for (const m of legalMoves) {
        const el = boardEl.querySelector(`.piece[data-row="${m.from.row}"][data-col="${m.from.col}"]`);
        if (el) el.classList.add('piece--must-capture');
      }
    }
  }

  function handlePointerDown(e) {
    if (!interactive) return;
    const squareEl = e.target.closest('.square');
    if (!squareEl) return;
    const square = { row: Number(squareEl.dataset.row), col: Number(squareEl.dataset.col) };

    if (selected && destinations.some((d) => squareEq(d, square))) {
      const move = findMove(selected, square);
      clearSelection();
      render();
      if (move) onMove(move);
      return;
    }

    const hasMovesFromSquare = legalMoves.some((m) => squareEq(m.from, square));
    if (hasMovesFromSquare) {
      selected = square;
      destinations = destinationsFrom(square);
      originSquare = square;
      startX = e.clientX;
      startY = e.clientY;
      pointerId = e.pointerId;
      dragging = false;
      boardEl.setPointerCapture(e.pointerId);
      render();
    } else {
      handleBlockedClick(square);
    }
  }

  function handlePointerMove(e) {
    if (pointerId === null || e.pointerId !== pointerId || !originSquare) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      dragging = true;
      createGhost(originSquare);
    }
    if (dragging) {
      moveGhost(e.clientX, e.clientY);
    }
  }

  function finishPointer(e) {
    const wasDragging = dragging;
    const origin = originSquare;
    removeGhost();
    if (pointerId !== null) boardEl.releasePointerCapture(pointerId);
    pointerId = null;
    originSquare = null;
    dragging = false;

    if (wasDragging && e) {
      const dropSquare = squareFromPoint(boardEl, e.clientX, e.clientY);
      if (dropSquare && destinations.some((d) => squareEq(d, dropSquare))) {
        const move = findMove(origin, dropSquare);
        clearSelection();
        render();
        if (move) onMove(move);
        return;
      }
    }
    render();
  }

  function handlePointerUp(e) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    finishPointer(e);
  }

  function handlePointerCancel(e) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    finishPointer(null);
  }

  boardEl.addEventListener('pointerdown', handlePointerDown);
  boardEl.addEventListener('pointermove', handlePointerMove);
  boardEl.addEventListener('pointerup', handlePointerUp);
  boardEl.addEventListener('pointercancel', handlePointerCancel);

  return {
    update(nextState, nextLegalMoves, nextInteractive, nextLastMove = null) {
      state = nextState;
      legalMoves = nextLegalMoves;
      interactive = nextInteractive;
      lastMove = nextLastMove;
      clearSelection();
      render();
    },
  };
}
