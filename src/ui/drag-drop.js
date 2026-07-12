import { renderBoard, squareFromPoint } from './board-view.js';

const DRAG_THRESHOLD = 6;

function squareEq(a, b) {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

function squareKey(s) {
  return `${s.row},${s.col}`;
}

/**
 * Pointer-events-based drag-and-drop (also supports tap-to-select then
 * tap-to-move). Multi-jump captures are selected progressively: each click
 * advances the piece to the next legal landing square; once a click reaches
 * the true end of a maximal capture sequence, the move is applied.
 */
export function createBoardController(boardEl, { onMove, onBlockedPiece }) {
  let state = null;
  let legalMoves = [];
  let interactive = false;
  let lastMove = null;

  let selected = null;
  let progress = [];
  let destinations = [];

  let pointerId = null;
  let originSquare = null;
  let startX = 0;
  let startY = 0;
  let ghostEl = null;
  let dragging = false;

  function render() {
    renderBoard(boardEl, state, { selected, destinations, lastMove, interactive });
  }

  function activeMoves() {
    return legalMoves.filter((m) => {
      if (!squareEq(m.from, selected)) return false;
      const path = m.path && m.path.length ? m.path : [m.from, m.to];
      if (path.length < progress.length) return false;
      for (let i = 0; i < progress.length; i++) {
        if (!squareEq(path[i], progress[i])) return false;
      }
      return true;
    });
  }

  function nextStepSquares() {
    const squares = [];
    const seen = new Set();
    for (const m of activeMoves()) {
      const path = m.path && m.path.length ? m.path : [m.from, m.to];
      if (path.length <= progress.length) continue;
      const next = path[progress.length];
      const k = squareKey(next);
      if (!seen.has(k)) {
        seen.add(k);
        squares.push(next);
      }
    }
    return squares;
  }

  function beginSelection(square) {
    selected = square;
    progress = [square];
    destinations = nextStepSquares();
  }

  function clearSelection() {
    selected = null;
    progress = [];
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

  function advanceTo(square) {
    const matching = activeMoves().filter((m) => {
      const path = m.path && m.path.length ? m.path : [m.from, m.to];
      return path.length > progress.length && squareEq(path[progress.length], square);
    });
    if (matching.length === 0) return false;

    const nextProgress = [...progress, square];
    const complete = matching.find((m) => {
      const path = m.path && m.path.length ? m.path : [m.from, m.to];
      return path.length === nextProgress.length;
    });

    if (complete) {
      clearSelection();
      render();
      onMove(complete);
      return true;
    }

    progress = nextProgress;
    destinations = nextStepSquares();
    render();
    return true;
  }

  function handlePointerDown(e) {
    if (!interactive) return;
    const squareEl = e.target.closest('.square');
    if (!squareEl) return;
    const square = { row: Number(squareEl.dataset.row), col: Number(squareEl.dataset.col) };

    if (selected && destinations.some((d) => squareEq(d, square))) {
      advanceTo(square);
      return;
    }

    const hasMovesFromSquare = legalMoves.some((m) => squareEq(m.from, square));
    if (hasMovesFromSquare) {
      beginSelection(square);
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
    removeGhost();
    if (pointerId !== null) boardEl.releasePointerCapture(pointerId);
    pointerId = null;
    originSquare = null;
    dragging = false;

    if (wasDragging && e) {
      const dropSquare = squareFromPoint(boardEl, e.clientX, e.clientY);
      if (dropSquare && destinations.some((d) => squareEq(d, dropSquare))) {
        advanceTo(dropSquare);
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