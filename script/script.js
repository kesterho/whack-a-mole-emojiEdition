

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
  easy: { label: 'Easy', seconds: 30, moleEveryMs: 1000 },
  hard: { label: 'Hard', seconds: 30, moleEveryMs: 700 },
  challenging: { label: 'Challenging', seconds: 30, moleEveryMs: 500 },
};
const DEFAULT_DIFFICULTY = 'easy';

const grid     = document.querySelector('#grid');
const scoreEl  = document.querySelector('#score');
const timeEl   = document.querySelector('#time');
const startBtn = document.querySelector('#start');
const stopBtn  = document.querySelector('#stop');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');


// ─────────────────────────────────────────────────────────────
// state
// ─────────────────────────────────────────────────────────────
let score = 0;
let selectedDifficulty = DEFAULT_DIFFICULTY;
let timeLeft = DIFFICULTIES[selectedDifficulty].seconds;
let currentIndex = null;
let gameInterval = null;
let timerInterval = null;


const setDifficultyButtonsDisabled = (disabled) => {
  difficultyBtns.forEach((btn) => {
    btn.disabled = disabled;
  });
};

const setDifficulty = (level) => {
  if (!DIFFICULTIES[level]) return;
  selectedDifficulty = level;
  difficultyBtns.forEach((btn) => {
    const isActive = btn.dataset.level === level;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  timeEl.textContent = DIFFICULTIES[level].seconds;
};


// ─────────────────────────────────────────────────────────────
// build the 3×3 grid
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
const whack = (i) => {
  if (i !== currentIndex) {
    score = Math.max(0, score - 1);
    scoreEl.textContent = score;
    return;
  }
  score++;
  scoreEl.textContent = score;
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
  timeLeft = settings.seconds;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  startBtn.disabled = true;
  startBtn.textContent = '…';
  stopBtn.disabled = false;
  setDifficultyButtonsDisabled(true);

  gameInterval = setInterval(tick, settings.moleEveryMs);
  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
};

const endGame = () => {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  gameInterval = null;
  timerInterval = null;
  hideMole();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setDifficultyButtonsDisabled(false);
  startBtn.textContent = `Play again (${DIFFICULTIES[selectedDifficulty].label} · last: ${score})`;
};


// ─────────────────────────────────────────────────────────────
// kick things off
// ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', endGame);
difficultyBtns.forEach((btn) => {
  btn.addEventListener('click', () => setDifficulty(btn.dataset.level));
});

setDifficulty(DEFAULT_DIFFICULTY);

