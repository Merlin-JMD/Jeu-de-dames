import { createInitialState, countPieces, cloneGrid, WHITE, BLACK } from './engine/board.js';
import { generateLegalMoves } from './engine/moves.js';
import { applyMove, isGameOver, confirmDraw, resign } from './engine/rules.js';
import { chooseAiMove } from './engine/ai.js';
import { createBoardController } from './ui/drag-drop.js';
import { setupControls } from './ui/controls.js';
import { renderCoordinates } from './ui/board-view.js';
import { playCaptureAnimation } from './ui/capture-animation.js';
import { playMoveSound } from './ui/sound.js';

const HUMAN_COLOR = WHITE;
const AI_COLOR = BLACK;

const boardEl = document.getElementById('board');
const controller = createBoardController(boardEl, { onMove: handleHumanMove, onBlockedPiece: handleBlockedPiece });
const controls = setupControls({ onNewGame: startNewGame });
const drawOfferPanel = document.getElementById('draw-offer-panel');
const drawContinueBtn = document.getElementById('draw-continue-btn');
const drawResignBtn = document.getElementById('draw-resign-btn');
drawContinueBtn.addEventListener('click', handleDrawContinue);
drawResignBtn.addEventListener('click', handleDrawResign);

const replayAiBtn = document.getElementById('replay-btn');
replayAiBtn.addEventListener('click', handleReplayAiMove);

let state = createInitialState();
let aiLevel = controls.getDifficulty();
let lastMove = null;
let aiThinking = false;
let lastAiMove = null;
let lastAiBeforeGrid = null;
let replaying = false;

const AI_SPEED_FACTOR = { 1: 2.5, 2: 1.6667, 3: 1.25, 4: 1 };
const BASE_ORIGIN_DELAY = 700;
const BASE_STEP_DELAY = 1200;
function getAiAnimationOptions(level) {
  const factor = AI_SPEED_FACTOR[level] || 1;
  return { originDelay: Math.round(BASE_ORIGIN_DELAY * factor), stepDelay: Math.round(BASE_STEP_DELAY * factor) };
}

function refreshUI() {
  const gameOver = isGameOver(state);
  const awaitingDrawDecision = !!state.pendingDraw;
  const humanTurn = !gameOver && !aiThinking && !replaying && !awaitingDrawDecision && state.turn === HUMAN_COLOR;
  const legalMoves = humanTurn ? generateLegalMoves(state) : [];
  controller.update(state, legalMoves, humanTurn, lastMove);

  const { white, black } = countPieces(state.grid);
  controls.setScoreText(`Blancs : ${white} — Noirs : ${black}`);
  drawOfferPanel.style.display = awaitingDrawDecision ? 'block' : 'none';

  if (gameOver) {
    controls.setTurnText('Partie terminée');
    if (state.winner === HUMAN_COLOR) controls.setMessage('Vous avez gagné !');
    else if (state.winner === AI_COLOR) controls.setMessage("L'ordinateur a gagné.");
    else controls.setMessage('Partie nulle.');
  } else if (awaitingDrawDecision) {
    controls.setTurnText('En attente de votre décision');
    controls.setMessage('');
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
  playMoveSound();
  state = applyMove(state, move);
  lastMove = move;
  refreshUI();

  if (!isGameOver(state) && !state.pendingDraw && state.turn === AI_COLOR) {
    scheduleAiMove();
  }
}

function handleDrawContinue() {
  state = confirmDraw(state);
  refreshUI();
}

function handleDrawResign() {
  state = resign(state, HUMAN_COLOR);
  refreshUI();
}

async function handleReplayAiMove() {
  if (!lastAiMove || !lastAiBeforeGrid || replaying || aiThinking) return;
  replaying = true;
  replayAiBtn.disabled = true;
  refreshUI();
  await playCaptureAnimation(boardEl, lastAiBeforeGrid, lastAiMove, getAiAnimationOptions(aiLevel));
  replaying = false;
  replayAiBtn.disabled = false;
  refreshUI();
}

function scheduleAiMove() {
  aiThinking = true;
  refreshUI();
  setTimeout(async () => {
    const move = chooseAiMove(state, aiLevel);
    if (move) {
      const beforeGrid = cloneGrid(state.grid);
      await playCaptureAnimation(boardEl, state.grid, move, getAiAnimationOptions(aiLevel));
      playMoveSound();
      state = applyMove(state, move);
      lastMove = move;
      lastAiMove = move;
      lastAiBeforeGrid = beforeGrid;
      replayAiBtn.disabled = false;
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
  lastAiMove = null;
  lastAiBeforeGrid = null;
  replaying = false;
  replayAiBtn.disabled = true;
  refreshUI();
}

renderCoordinates();
startNewGame(aiLevel);
