

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


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─────────────────────────────────────────────────────────────
// Supabase setup
// (Settings → API in your Supabase project)
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://ozrvtgmypugkcjncawgx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KcWjSEC8bWQ-T484mQq3ew_deVS8_Dk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



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
const playModeBtns = document.querySelectorAll('.mode-btn');
const durationControls = document.querySelector('#duration-controls');
const customDurationInput = document.querySelector('#custom-duration');
const setDurationBtn = document.querySelector('#set-duration');
const playerNameInput = document.querySelector('#player-name-input');
const saveNameBtn = document.querySelector('#save-name');
const profileNameHint = document.querySelector('#profile-name-hint');
const leaderboardSection = document.querySelector('#leaderboard');
const lbStatus = document.querySelector('#lb-status');
const lbList = document.querySelector('#lb-list');


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
const PLAY_MODES = {
  casual: 'casual',
  ranked: 'ranked',
};
const RANKED_DURATION_SECONDS = DEFAULT_DURATION;
const LEADERBOARD_LIMIT = 10;
const DEFAULT_PLAYER_NAME = 'guest';
const MAX_PLAYER_NAME_LENGTH = 20;
let selectedPlayMode = PLAY_MODES.casual;
let previousCasualDifficulty = DEFAULT_DIFFICULTY;
let previousCasualDuration = DEFAULT_DURATION;

let username = DEFAULT_PLAYER_NAME;


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

const setModeButtonsDisabled = (disabled) => {
  playModeBtns.forEach((btn) => {
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

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const renderLeaderboardMessage = (message) => {
  lbList.innerHTML = `<li class="lb-empty">${escapeHtml(message)}</li>`;
};

const setLeaderboardCasualState = () => {
  leaderboardSection.classList.add('is-locked');
  lbStatus.textContent = 'Ranked mode only';
  renderLeaderboardMessage('Switch to Ranked Play to view top scores.');
};

const loadLeaderboard = async () => {
  if (selectedPlayMode !== PLAY_MODES.ranked) {
    setLeaderboardCasualState();
    return;
  }

  leaderboardSection.classList.remove('is-locked');
  lbStatus.textContent = 'loading top players...';

  const { data, error } = await supabase
    .from('scores')
    .select('username, score, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(LEADERBOARD_LIMIT);

  if (error) {
    console.error(error);
    lbStatus.textContent = 'leaderboard unavailable';
    renderLeaderboardMessage(`error: ${error.message}`);
    return;
  }

  if (!data?.length) {
    lbStatus.textContent = 'no ranked runs yet';
    renderLeaderboardMessage('Nobody has played Ranked yet - be first.');
    return;
  }

  lbStatus.textContent = 'top 10 ranked runs';
  lbList.innerHTML = data.map((row, i) => {
    const isYou = row.username === username ? ' is-you' : '';
    return `
      <li class="lb-row${isYou}">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-name">${escapeHtml(row.username)}</span>
        <span class="lb-score">${row.score}</span>
      </li>
    `;
  }).join('');
};

const setPlayMode = (mode) => {
  if (!PLAY_MODES[mode]) return;
  if (selectedPlayMode === PLAY_MODES.casual && mode === PLAY_MODES.ranked) {
    previousCasualDifficulty = selectedDifficulty;
    previousCasualDuration = selectedDuration;
  }
  selectedPlayMode = mode;
  const isRanked = selectedPlayMode === PLAY_MODES.ranked;

  playModeBtns.forEach((btn) => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  document.body.classList.toggle('ranked-theme', isRanked);
  durationControls.classList.toggle('is-hidden', isRanked);

  if (isRanked) {
    setDifficulty('challenging');
    setDuration(RANKED_DURATION_SECONDS);
    setDifficultyButtonsDisabled(true);
    setDurationButtonsDisabled(true);
    void loadLeaderboard();
    return;
  }

  if (!isGameRunning) {
    setDifficulty(previousCasualDifficulty);
    setDuration(previousCasualDuration);
    setDifficultyButtonsDisabled(false);
    setDurationButtonsDisabled(false);
    timeEl.textContent = selectedDuration;
  }

  setLeaderboardCasualState();
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



const normalizeUsername = (value) => String(value ?? '').trim().slice(0, MAX_PLAYER_NAME_LENGTH);

const setProfileHint = (message, tone = '') => {
  profileNameHint.textContent = message;
  profileNameHint.classList.remove('is-error', 'is-success');
  if (tone) {
    profileNameHint.classList.add(`is-${tone}`);
  }
};

const setUsername = (name) => {
  username = name;
  playerNameInput.value = name;
};

const saveUsernameFromInput = () => {
  const candidate = normalizeUsername(playerNameInput.value);
  if (!candidate) {
    playerNameInput.value = username;
    setProfileHint('Name cannot be empty.', 'error');
    return false;
  }

  if (candidate === username) {
    playerNameInput.value = username;
    setProfileHint('Name is already up to date.');
    return false;
  }

  setUsername(candidate);
  localStorage.setItem('emojiWhackName', candidate);
  setProfileHint('Name saved for ranked runs.', 'success');
  return true;
};

const loadUsername = () => {
  const saved = localStorage.getItem('emojiWhackName');
  const loaded = normalizeUsername(saved);
  setUsername(loaded || DEFAULT_PLAYER_NAME);
  setProfileHint('Your ranked runs use this name.');
};

saveNameBtn.addEventListener('click', () => {
  const changed = saveUsernameFromInput();
  if (changed && selectedPlayMode === PLAY_MODES.ranked) {
    void loadLeaderboard();
  }
});

playerNameInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  saveNameBtn.click();
});

playerNameInput.addEventListener('blur', () => {
  const normalized = normalizeUsername(playerNameInput.value);
  playerNameInput.value = normalized || username;
});





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
  setModeButtonsDisabled(true);
  setDifficultyButtonsDisabled(true);
  setDurationButtonsDisabled(true);

  gameInterval = setInterval(tick, settings.moleEveryMs);
  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
};

const endGame = async () => {
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
  setModeButtonsDisabled(false);
  if (selectedPlayMode === PLAY_MODES.ranked) {
    setDifficultyButtonsDisabled(true);
    setDurationButtonsDisabled(true);
  } else {
    setDifficultyButtonsDisabled(false);
    setDurationButtonsDisabled(false);
  }
  startBtn.textContent = `Play again (${DIFFICULTIES[selectedDifficulty].label} · ${selectedDuration}s · last: ${score})`;
  if (selectedPlayMode === PLAY_MODES.ranked) {
    await saveScore(score);
    await loadLeaderboard();
  }
};

const saveScore = async (finalScore) => {
  if (selectedPlayMode !== PLAY_MODES.ranked) return;
  if (!username) return;
  lbStatus.textContent = 'saving your score...';
  const { error } = await supabase
    .from('scores')
    .insert({ username, score: finalScore });
  if (error) {
    console.error(error);
    lbStatus.textContent = `couldn't save: ${error.message}`;
    return;
  }

  lbStatus.textContent = `saved ${username} -> ${finalScore}`;
};
// ─────────────────────────────────────────────────────────────
// kick things off
// ─────────────────────────────────────────────────────────────

startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', endGame);
difficultyBtns.forEach((btn) => {
  btn.addEventListener('click', () => setDifficulty(btn.dataset.level));
});
playModeBtns.forEach((btn) => {
  btn.addEventListener('click', () => setPlayMode(btn.dataset.mode));
});
setDurationBtn.addEventListener('click', applyCustomDuration);
customDurationInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  applyCustomDuration();
});

setDifficulty(DEFAULT_DIFFICULTY);
setDuration(DEFAULT_DURATION);
setPlayMode(PLAY_MODES.casual);

loadUsername();
setLeaderboardCasualState();

