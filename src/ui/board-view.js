import { SIZE, isDarkSquare } from '../engine/board.js';

// The human always plays White, and White moves first, so White's rows
// (0-3) are drawn at the bottom of the screen, nearest the player.
function toEngineRow(visualRow) {
  return SIZE - 1 - visualRow;
}

export function renderBoard(boardEl, state, uiState = {}) {
  const { selected = null, destinations = [], lastMove = null, interactive = true, capturePath = null, animatingSquare = null } = uiState;
  boardEl.innerHTML = '';
  boardEl.classList.toggle('board--locked', !interactive);

  const destinationKeys = new Set(destinations.map((d) => `${d.row},${d.col}`));
  const lastMoveKeys = new Set(
    lastMove ? lastMove.path.map((p) => `${p.row},${p.col}`) : []
  );
  const capturePathKeys = new Set(
    capturePath ? capturePath.map((p) => `${p.row},${p.col}`) : []
  );

  for (let visualRow = 0; visualRow < SIZE; visualRow++) {
    const row = toEngineRow(visualRow);
    for (let col = 0; col < SIZE; col++) {
      const square = document.createElement('div');
      const dark = isDarkSquare(row, col);
      square.className = `square ${dark ? 'square--dark' : 'square--light'}`;
      square.dataset.row = String(row);
      square.dataset.col = String(col);

      if (selected && selected.row === row && selected.col === col) {
        square.classList.add('square--selected');
      }
      if (destinationKeys.has(`${row},${col}`)) {
        square.classList.add('square--destination');
      }
      if (capturePathKeys.has(`${row},${col}`)) {
        square.classList.add('square--capture-path');
      }

      const piece = state.grid[row][col];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece piece--${piece.color === 'W' ? 'white' : 'black'}${
          piece.king ? ' piece--king' : ''
        }`;
        if (animatingSquare && animatingSquare.row === row && animatingSquare.col === col) {
          pieceEl.classList.add('piece--capturing');
        }
        pieceEl.dataset.row = String(row);
        pieceEl.dataset.col = String(col);
        square.appendChild(pieceEl);
      }

      boardEl.appendChild(square);
    }
  }
}

export function squareFromPoint(boardEl, clientX, clientY) {
  const rect = boardEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const cellWidth = rect.width / SIZE;
  const cellHeight = rect.height / SIZE;
  const col = Math.floor((clientX - rect.left) / cellWidth);
  const visualRow = Math.floor((clientY - rect.top) / cellHeight);
  if (visualRow < 0 || visualRow >= SIZE || col < 0 || col >= SIZE) return null;
  return { row: toEngineRow(visualRow), col };
}

const COLUMN_LETTERS = 'abcdefghij';

export function renderCoordinates() {
  const topEl = document.getElementById('col-labels-top');
  const bottomEl = document.getElementById('col-labels-bottom');
  const leftEl = document.getElementById('row-labels-left');
  const rightEl = document.getElementById('row-labels-right');
  if (!topEl || !bottomEl || !leftEl || !rightEl) return;

  topEl.innerHTML = '';
  bottomEl.innerHTML = '';
  for (let col = 0; col < SIZE; col++) {
    const letter = COLUMN_LETTERS[col];
    const spanTop = document.createElement('span');
    spanTop.className = 'coord-label';
    spanTop.textContent = letter;
    topEl.appendChild(spanTop);

    const spanBottom = document.createElement('span');
    spanBottom.className = 'coord-label';
    spanBottom.textContent = letter;
    bottomEl.appendChild(spanBottom);
  }

  leftEl.innerHTML = '';
  rightEl.innerHTML = '';
  for (let visualRow = 0; visualRow < SIZE; visualRow++) {
    const row = toEngineRow(visualRow);
    const number = String(row + 1);
    const spanLeft = document.createElement('span');
    spanLeft.className = 'coord-label';
    spanLeft.textContent = number;
    leftEl.appendChild(spanLeft);

    const spanRight = document.createElement('span');
    spanRight.className = 'coord-label';
    spanRight.textContent = number;
    rightEl.appendChild(spanRight);
  }
}
