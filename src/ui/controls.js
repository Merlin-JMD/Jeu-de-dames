export function setupControls({ onNewGame }) {
  const difficultySelect = document.getElementById('difficulty');
  const newGameBtn = document.getElementById('new-game-btn');
  const turnIndicator = document.getElementById('turn-indicator');
  const scoreIndicator = document.getElementById('score-indicator');
  const messageEl = document.getElementById('message');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const boardPanel = document.querySelector('.app-main');

  newGameBtn.addEventListener('click', () => {
    onNewGame(Number(difficultySelect.value));
  });

  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      boardPanel.requestFullscreen();
    }
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
