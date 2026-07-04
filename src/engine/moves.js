import { isOnBoard, isPromotionRow } from './board.js';

const DIRECTIONS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function key(row, col) {
  return `${row},${col}`;
}

/**
 * Depth-first search for maximal capture chains starting at (row, col).
 * Captured pieces are tracked but not removed from `grid` — they remain as
 * blockers (cannot be jumped again, cannot be landed on) until the whole
 * chain resolves, per FMJD rules.
 */
function searchCaptureChains(grid, color, curRow, curCol, isKing, capturedKeys, capturedList, path) {
  const results = [];

  for (const [dr, dc] of DIRECTIONS) {
    if (isKing) {
      let dist = 1;
      let enemyRow = null;
      let enemyCol = null;

      // Walk outward until we hit a non-empty square or the edge.
      while (true) {
        const r = curRow + dr * dist;
        const c = curCol + dc * dist;
        if (!isOnBoard(r, c)) break;
        const k = key(r, c);
        if (grid[r][c] === null && !capturedKeys.has(k)) {
          dist++;
          continue;
        }
        if (capturedKeys.has(k)) break; // already-captured piece blocks further travel
        if (grid[r][c].color === color) break; // own piece blocks
        enemyRow = r;
        enemyCol = c;
        break;
      }

      if (enemyRow === null) continue;

      // Landing squares are any empty squares immediately beyond the enemy piece.
      let landDist = dist + 1;
      while (true) {
        const lr = curRow + dr * landDist;
        const lc = curCol + dc * landDist;
        if (!isOnBoard(lr, lc)) break;
        const lk = key(lr, lc);
        if (grid[lr][lc] !== null || capturedKeys.has(lk)) break;

        const nextCapturedKeys = new Set(capturedKeys);
        nextCapturedKeys.add(key(enemyRow, enemyCol));
        const nextCapturedList = [...capturedList, { row: enemyRow, col: enemyCol }];
        const nextPath = [...path, { row: lr, col: lc }];
        const nextIsKing = isKing || isPromotionRow(color, lr);

        const sub = searchCaptureChains(grid, color, lr, lc, nextIsKing, nextCapturedKeys, nextCapturedList, nextPath);
        if (sub.length === 0) {
          results.push({ path: nextPath, capturedList: nextCapturedList, finalIsKing: nextIsKing });
        } else {
          results.push(...sub);
        }
        landDist++;
      }
    } else {
      const ar = curRow + dr;
      const ac = curCol + dc;
      const lr = curRow + 2 * dr;
      const lc = curCol + 2 * dc;
      if (!isOnBoard(lr, lc)) continue;

      const ak = key(ar, ac);
      if (grid[ar][ac] === null || capturedKeys.has(ak)) continue;
      if (grid[ar][ac].color === color) continue;

      const lk = key(lr, lc);
      if (grid[lr][lc] !== null || capturedKeys.has(lk)) continue;

      const nextCapturedKeys = new Set(capturedKeys);
      nextCapturedKeys.add(ak);
      const nextCapturedList = [...capturedList, { row: ar, col: ac }];
      const nextPath = [...path, { row: lr, col: lc }];
      const nextIsKing = isKing || isPromotionRow(color, lr);

      const sub = searchCaptureChains(grid, color, lr, lc, nextIsKing, nextCapturedKeys, nextCapturedList, nextPath);
      if (sub.length === 0) {
        results.push({ path: nextPath, capturedList: nextCapturedList, finalIsKing: nextIsKing });
      } else {
        results.push(...sub);
      }
    }
  }

  return results;
}

function findCaptureMoves(grid, piece, row, col) {
  const chains = searchCaptureChains(grid, piece.color, row, col, piece.king, new Set(), [], [{ row, col }]);
  return chains.map((chain) => ({
    from: { row, col },
    to: chain.path[chain.path.length - 1],
    path: chain.path,
    captures: chain.capturedList,
    isCapture: true,
    promoted: !piece.king && chain.finalIsKing,
  }));
}

function findSimpleMoves(grid, piece, row, col) {
  const moves = [];

  if (piece.king) {
    for (const [dr, dc] of DIRECTIONS) {
      let dist = 1;
      while (true) {
        const r = row + dr * dist;
        const c = col + dc * dist;
        if (!isOnBoard(r, c) || grid[r][c] !== null) break;
        moves.push({
          from: { row, col },
          to: { row: r, col: c },
          path: [{ row, col }, { row: r, col: c }],
          captures: [],
          isCapture: false,
          promoted: false,
        });
        dist++;
      }
    }
  } else {
    const forward = piece.color === 'W' ? 1 : -1;
    for (const dc of [-1, 1]) {
      const r = row + forward;
      const c = col + dc;
      if (isOnBoard(r, c) && grid[r][c] === null) {
        moves.push({
          from: { row, col },
          to: { row: r, col: c },
          path: [{ row, col }, { row: r, col: c }],
          captures: [],
          isCapture: false,
          promoted: isPromotionRow(piece.color, r),
        });
      }
    }
  }

  return moves;
}

/**
 * Generates all legal moves for the side to move, applying the mandatory
 * capture rule and the majority-capture rule (must play a sequence capturing
 * the maximum possible number of pieces).
 */
export function generateLegalMoves(state) {
  const { grid, turn } = state;
  const captureMoves = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid.length; col++) {
      const piece = grid[row][col];
      if (!piece || piece.color !== turn) continue;
      captureMoves.push(...findCaptureMoves(grid, piece, row, col));
    }
  }

  if (captureMoves.length > 0) {
    const maxCaptures = Math.max(...captureMoves.map((m) => m.captures.length));
    return captureMoves.filter((m) => m.captures.length === maxCaptures);
  }

  const simpleMoves = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid.length; col++) {
      const piece = grid[row][col];
      if (!piece || piece.color !== turn) continue;
      simpleMoves.push(...findSimpleMoves(grid, piece, row, col));
    }
  }
  return simpleMoves;
}
