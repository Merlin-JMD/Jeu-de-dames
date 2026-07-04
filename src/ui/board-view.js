import { SIZE, isDarkSquare } from '../engine/board.js';

export function renderBoard(boardEl, state, uiState = {}) {
  const { selected = null, destinations = [], lastMove = null, interactive = true } = uiState;
  boardEl.innerHTML = '';
  boardEl.classList.toggle('board--locked', !interactive);

  const destinationKeys = new Set(destinations.map((d) => `${d.row},${d.col}`));
  const lastMoveKeys = new Set(
    lastMove ? lastMove.path.map((p) => `${p.row},${p.col}`) : []
  );

  for (let row = 0; row < SIZE; row++) {
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
      if (lastMoveKeys.has(`${row},${col}`)) {
        square.classList.add('square--last-move');
      }

      const piece = state.grid[row][col];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece piece--${piece.color === 'W' ? 'white' : 'black'}${
          piece.king ? ' piece--king' : ''
        }`;
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
  const row = Math.floor((clientY - rect.top) / cellHeight);
  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return null;
  return { row, col };
}
