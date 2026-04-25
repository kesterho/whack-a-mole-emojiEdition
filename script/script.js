

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
const GAME_SECONDS = 30;
const MOLE_EVERY_MS = 900;

const grid     = document.querySelector('#grid');
const scoreEl  = document.querySelector('#score');
const timeEl   = document.querySelector('#time');
const startBtn = document.querySelector('#start');
const stopBtn  = document.querySelector('#stop');


// ─────────────────────────────────────────────────────────────
// state
// ─────────────────────────────────────────────────────────────
let score = 0;
let timeLeft = GAME_SECONDS;
let currentIndex = null;
let gameInterval = null;
let timerInterval = null;


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
  score = 0;
  timeLeft = GAME_SECONDS;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  startBtn.disabled = true;
  startBtn.textContent = '…';
  stopBtn.disabled = false;

  gameInterval = setInterval(tick, MOLE_EVERY_MS);
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
  startBtn.textContent = `Play again (last: ${score})`;
};


// ─────────────────────────────────────────────────────────────
// kick things off
// ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', endGame);

