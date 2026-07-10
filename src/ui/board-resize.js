const MIN_CELL = 30;
const MAX_CELL = 90;

function currentCellSize() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--cell-size').trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 56;
}

// The handle sits in the bottom-left corner of the board. Dragging it left
// or down grows the board; dragging it right or up shrinks it.
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
    newSize = Math.min(MAX_CELL, Math.max(MIN_CELL, newSize));
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