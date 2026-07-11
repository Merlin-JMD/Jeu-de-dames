import { isSoundEnabled, toggleSound } from './sound.js';
import { maxCellForViewport } from './board-resize.js';

export function setupControls({ onNewGame }) {
  const difficultySelect = document.getElementById('difficulty');
  const newGameBtn = document.getElementById('new-game-btn');
  const turnIndicator = document.getElementById('turn-indicator');
  const scoreIndicator = document.getElementById('score-indicator');
  const messageEl = document.getElementById('message');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const boardPanel = document.getElementById('scale-wrapper');
  const soundBtn = document.getElementById('sound-btn');

  newGameBtn.addEventListener('click', () => {
    onNewGame(Number(difficultySelect.value));
  });

  let cellSizeBeforeFullscreen = null;

  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      cellSizeBeforeFullscreen = getComputedStyle(document.documentElement).getPropertyValue('--cell-size').trim();
      boardPanel.requestFullscreen().then(() => {
        const optimalSize = maxCellForViewport();
        document.documentElement.style.setProperty('--cell-size', optimalSize + 'px');
      });
    }
  });

  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = document.fullscreenElement
      ? 'Retour affichage normal'
      : 'Plein ecran';
    if (!document.fullscreenElement && cellSizeBeforeFullscreen) {
      document.documentElement.style.setProperty('--cell-size', cellSizeBeforeFullscreen);
    }
  });

  soundBtn.textContent = isSoundEnabled() ? 'Son : On' : 'Son : Off';
  soundBtn.addEventListener('click', () => {
    const nowEnabled = toggleSound();
    soundBtn.textContent = nowEnabled ? 'Son : On' : 'Son : Off';
  });

  return {
    getDifficulty: () => Number(difficultySelect.value),
    setTurnText(text) {
      turnIndicator.textContent = text;
    },
    setScoreText(text) {
      scoreIndicator.textContent = text;
    },
    setMessage(text) {
      messageEl.textContent = text;
    },
  };
}
