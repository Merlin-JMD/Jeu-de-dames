export const SIZE = 10;
export const WHITE = 'W';
export const BLACK = 'B';

export function otherColor(color) {
  return color === WHITE ? BLACK : WHITE;
}

export function isDarkSquare(row, col) {
  return (row + col) % 2 === 1;
}

export function isOnBoard(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

export function createEmptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

/**
 * White starts on rows 0-3 (top), Black on rows 6-9 (bottom), on dark squares only.
 * White's forward direction is toward increasing row; Black's is toward decreasing row.
 */
export function createInitialBoard() {
  const grid = createEmptyGrid();
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!isDarkSquare(row, col)) continue;
      if (row <= 3) {
        grid[row][col] = { color: WHITE, king: false };
      } else if (row >= 6) {
        grid[row][col] = { color: BLACK, king: false };
      }
    }
  }
  return grid;
}

export function createInitialState() {
  return {
    grid: createInitialBoard(),
    turn: WHITE,
    movesSinceProgress: 0,
    winner: null,
    drawReason: null,
  };
}

export function cloneGrid(grid) {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function cloneState(state) {
  return {
    grid: cloneGrid(state.grid),
    turn: state.turn,
    movesSinceProgress: state.movesSinceProgress,
    winner: state.winner,
    drawReason: state.drawReason,
  };
}

export function getPiece(grid, row, col) {
  if (!isOnBoard(row, col)) return null;
  return grid[row][col];
}

export function forEachPiece(grid, callback) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const piece = grid[row][col];
      if (piece) callback(piece, row, col);
    }
  }
}

export function countPieces(grid) {
  let white = 0;
  let black = 0;
  forEachPiece(grid, (piece) => {
    if (piece.color === WHITE) white++;
    else black++;
  });
  return { white, black };
}

export function isPromotionRow(color, row) {
  return color === WHITE ? row === SIZE - 1 : row === 0;
}

export function emptyState(turn = WHITE) {
  return {
    grid: createEmptyGrid(),
    turn,
    movesSinceProgress: 0,
    winner: null,
    drawReason: null,
  };
}

export function placePiece(grid, row, col, color, king = false) {
  grid[row][col] = { color, king };
}
