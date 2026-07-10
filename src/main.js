import { createInitialState, countPieces, WHITE, BLACK } from './engine/board.js';
import { generateLegalMoves } from './engine/moves.js';
import { applyMove, isGameOver } from './engine/rules.js';
import { chooseAiMove } from './engine/ai.js';
import { createBoardController } from './ui/drag-drop.js';
import { setupControls } from './ui/controls.js';
import { renderCoordinates } from './ui/board-view.js';
import { playCaptureAnimation } from './ui/capture-animation.js';

const HUMAN_COLOR = WHITE;
const AI_COLOR = BLACK;

const boardEl = document.getElementById('board');
const controller = createBoardController(boardEl, { onMove: handleHumanMove, onBlockedPiece: handleBlockedPiece });
const controls = setupControls({ onNewGame: startNewGame });

let state = createInitialState();
let aiLevel = controls.getDifficulty();
let lastMove = null;
let aiThinking = false;

function refreshUI() {
  const gameOver = isGameOver(state);
  const humanTurn = !gameOver && !aiThinking && state.turn === HUMAN_COLOR;
  const legalMoves = humanTurn ? generateLegalMoves(state) : [];
  controller.update(state, legalMoves, humanTurn, lastMove);

  const { white, black } = countPieces(state.grid);
  controls.setScoreText(`Blancs : ${white} — Noirs : ${black}`);

  if (gameOver) {
    controls.setTurnText('Partie terminée');
    if (state.winner === HUMAN_COLOR) controls.setMessage('Vous avez gagné !');
    else if (state.winner === AI_COLOR) controls.setMessage("L'ordinateur a gagné.");
    else controls.setMessage('Partie nulle.');
  } else if (aiThinking) {
    controls.setTurnText("L'ordinateur réfléchit…");
    controls.setMessage('');
  } else {
    controls.setTurnText(humanTurn ? 'À vous de jouer' : "Tour de l'ordinateur");
    controls.setMessage('');
  }
}

function handleBlockedPiece() {
  controls.setMessage('Prise obligatoire ! Ce pion ne peut pas jouer : capturez avec un pion illumin\u00E9.');
}
async function handleHumanMove(move) {
  if (move.isCapture && move.captures.length > 1) {
    await playCaptureAnimation(boardEl, state.grid, move);
  }
  state = applyMove(state, move);
  lastMove = move;
  refreshUI();

  if (!isGameOver(state) && state.turn === AI_COLOR) {
    scheduleAiMove();
  }
}

function scheduleAiMove() {
  aiThinking = true;
  refreshUI();
  setTimeout(async () => {
    const move = chooseAiMove(state, aiLevel);
    if (move) {
      await playCaptureAnimation(boardEl, state.grid, move);
      state = applyMove(state, move);
      lastMove = move;
    }
    aiThinking = false;
    refreshUI();
  }, 1000);
}

function startNewGame(level) {
  aiLevel = level;
  state = createInitialState();
  lastMove = null;
  aiThinking = false;
  refreshUI();
}

renderCoordinates();
startNewGame(aiLevel);
