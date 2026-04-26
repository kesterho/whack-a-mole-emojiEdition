

// ================================================================
// 🎮 script.js — Emoji Whack · WORKING REFERENCE
//
// This is the full, working game. Open index.html in a browser →
// click Start → play.
//
// For class: copy `script.scaffold.js` → `script.js` BEFORE handing
// the folder to the student, so he writes the 5 TODOs himself.
//   cp script.scaffold.js script.js
// ================================================================


// ─────────────────────────────────────────────────────────────
// constants + DOM refs
// ─────────────────────────────────────────────────────────────
const MOLES = ['🐹', '🦊', '🐻', '🐼', '🐸', '🦖', '🐵', '🐙', '🐶'];
const GRID_SIZE = 16;
const DIFFICULTIES = {
  easy: { label: 'Easy', moleEveryMs: 1000 },
  hard: { label: 'Hard', moleEveryMs: 700 },
  challenging: { label: 'Challenging', moleEveryMs: 500 },
};
const DEFAULT_DIFFICULTY = 'easy';
const DEFAULT_DURATION = 30;
const GAME_OVER_LAYOUT = [
  '', '', '', '',
  'G', 'A', 'M', 'E',
  'O', 'V', 'E', 'R',
  '', '', '', '',
];

const grid     = document.querySelector('#grid');
const scoreEl  = document.querySelector('#score');
const scoreDeltaEl = document.querySelector('#score-delta');
const timeEl   = document.querySelector('#time');
const startBtn = document.querySelector('#start');
const stopBtn  = document.querySelector('#stop');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const customDurationInput = document.querySelector('#custom-duration');
const setDurationBtn = document.querySelector('#set-duration');


// ─────────────────────────────────────────────────────────────
// state
// ─────────────────────────────────────────────────────────────
let score = 0;
let selectedDifficulty = DEFAULT_DIFFICULTY;
let selectedDuration = DEFAULT_DURATION;
let timeLeft = selectedDuration;
let currentIndex = null;
let gameInterval = null;
let timerInterval = null;
let isGameRunning = false;
let scoreDeltaTimeout = null;
const MIN_DURATION_SECONDS = 5;
const MAX_DURATION_SECONDS = 300;


const showScoreDelta = (value, type) => {
  clearTimeout(scoreDeltaTimeout);
  scoreDeltaEl.textContent = value;
  scoreDeltaEl.classList.remove('positive', 'negative');
  scoreDeltaEl.classList.add(type, 'show');
  scoreDeltaTimeout = setTimeout(() => {
    scoreDeltaEl.classList.remove('show', 'positive', 'negative');
    scoreDeltaEl.textContent = '';
  }, 450);
};


const setDifficultyButtonsDisabled = (disabled) => {
  difficultyBtns.forEach((btn) => {
    btn.disabled = disabled;
  });
};

const setDurationButtonsDisabled = (disabled) => {
  customDurationInput.disabled = disabled;
  setDurationBtn.disabled = disabled;
};

const setDifficulty = (level) => {
  if (!DIFFICULTIES[level]) return;
  selectedDifficulty = level;
  difficultyBtns.forEach((btn) => {
    const isActive = btn.dataset.level === level;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
};

const setDuration = (seconds) => {
  const parsedSeconds = Number(seconds);
  if (!Number.isInteger(parsedSeconds)) return;
  if (parsedSeconds < MIN_DURATION_SECONDS || parsedSeconds > MAX_DURATION_SECONDS) return;
  selectedDuration = parsedSeconds;
  if (!isGameRunning) timeEl.textContent = selectedDuration;
  customDurationInput.value = String(selectedDuration);
};

const applyCustomDuration = () => {
  const value = Number(customDurationInput.value);
  if (!Number.isInteger(value) || value < MIN_DURATION_SECONDS || value > MAX_DURATION_SECONDS) {
    customDurationInput.value = String(selectedDuration);
    return;
  }
  setDuration(value);
};


// ─────────────────────────────────────────────────────────────
// build the 4×4 grid
// ─────────────────────────────────────────────────────────────
for (let i = 0; i < GRID_SIZE; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.index = i;
  cell.addEventListener('click', () => whack(i));
  grid.appendChild(cell);
}


// ─────────────────────────────────────────────────────────────
// game logic
// ─────────────────────────────────────────────────────────────
const clearBoardVisuals = () => {
  for (const cell of grid.children) {
    cell.textContent = '';
    cell.classList.remove('has-mole', 'hit', 'miss', 'game-over-letter', 'game-over-empty');
  }
};

const showGameOverBoard = () => {
  clearBoardVisuals();
  GAME_OVER_LAYOUT.forEach((letter, index) => {
    const cell = grid.children[index];
    if (!cell) return;
    if (letter) {
      cell.textContent = letter;
      cell.classList.add('game-over-letter');
      return;
    }
    cell.classList.add('game-over-empty');
  });
};

const whack = (i) => {
  if (!isGameRunning) return;
  if (i !== currentIndex) {
    score = Math.max(0, score - 1);
    scoreEl.textContent = score;
    showScoreDelta('-1', 'negative');
    const cell = grid.children[i];
    cell.classList.add('miss');
    setTimeout(() => cell.classList.remove('miss'), 180);
    return;
  }
  score++;
  scoreEl.textContent = score;
  showScoreDelta('+1', 'positive');
  const cell = grid.children[i];
  cell.classList.add('hit');
  setTimeout(() => cell.classList.remove('hit'), 300);
  hideMole();
};

const showMole = () => {
  const i = Math.floor(Math.random() * GRID_SIZE);
  const emoji = MOLES[Math.floor(Math.random() * MOLES.length)];
  const cell = grid.children[i];
  cell.textContent = emoji;
  cell.classList.add('has-mole');
  currentIndex = i;
};

const hideMole = () => {
  if (currentIndex === null) return;
  const cell = grid.children[currentIndex];
  cell.textContent = '';
  cell.classList.remove('has-mole');
  currentIndex = null;
};

const tick = () => {
  hideMole();
  showMole();
};

const startGame = () => {
  const settings = DIFFICULTIES[selectedDifficulty];
  score = 0;
  timeLeft = selectedDuration;
  isGameRunning = true;
  currentIndex = null;
  clearBoardVisuals();
  scoreDeltaEl.textContent = '';
  scoreDeltaEl.classList.remove('show', 'positive', 'negative');
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  startBtn.disabled = true;
  startBtn.textContent = '…';
  stopBtn.disabled = false;
  setDifficultyButtonsDisabled(true);
  setDurationButtonsDisabled(true);

  gameInterval = setInterval(tick, settings.moleEveryMs);
  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
};

const endGame = () => {
  if (!isGameRunning && !gameInterval && !timerInterval) return;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  gameInterval = null;
  timerInterval = null;
  isGameRunning = false;
  hideMole();
  showGameOverBoard();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setDifficultyButtonsDisabled(false);
  setDurationButtonsDisabled(false);
  startBtn.textContent = `Play again (${DIFFICULTIES[selectedDifficulty].label} · ${selectedDuration}s · last: ${score})`;
};


// ─────────────────────────────────────────────────────────────
// kick things off
// ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', endGame);
difficultyBtns.forEach((btn) => {
  btn.addEventListener('click', () => setDifficulty(btn.dataset.level));
});
setDurationBtn.addEventListener('click', applyCustomDuration);
customDurationInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  applyCustomDuration();
});

setDifficulty(DEFAULT_DIFFICULTY);
setDuration(DEFAULT_DURATION);

