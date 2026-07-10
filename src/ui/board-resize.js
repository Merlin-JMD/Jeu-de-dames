const MIN_CELL = 30;
const MAX_CELL = 105;

function currentCellSize() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--cell-size').trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 56;
}

// Estimates the largest cell size (in px) that still lets the whole board,
// its coordinate labels, and the controls row fit inside the current
// window without overflowing horizontally or vertically.
function maxCellForViewport() {
  const horizontalOverhead = 120; // side padding + coordinate columns + board border
  const verticalOverhead = 260; // header + controls row + padding + board border
  const maxByWidth = (window.innerWidth - horizontalOverhead) / 10;
  const maxByHeight = (window.innerHeight - verticalOverhead) / 10;
  return Math.max(MIN_CELL, Math.min(MAX_CELL, maxByWidth, maxByHeight));
}

// The handle sits in the bottom-left corner of the board. Dragging it left
// or down grows the board; dragging it right or up shrinks it. Growth is
// capped both by MAX_CELL and by whatever actually fits in the window.
export function setupBoardResize(handleEl) {
  if (!handleEl) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startSize = 0;

  function onPointerDown(e) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startSize = currentCellSize();
    handleEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = startX - e.clientX;
    const dy = e.clientY - startY;
    const delta = (dx + dy) / 2;
    let newSize = startSize + delta / 10;
    const dynamicMax = maxCellForViewport();
    newSize = Math.min(dynamicMax, Math.max(MIN_CELL, newSize));
    document.documentElement.style.setProperty('--cell-size', `${newSize}px`);
  }

  function onPointerUp() {
    dragging = false;
  }

  handleEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}