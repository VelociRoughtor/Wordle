const BOARD_ROWS = 6;
const WORD_LENGTH = 5;
let currentRow = 0;
let currentCol = 0;
let board = [];
let targetWord = "";

// DOM elements
const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");
const keyboardEl = document.getElementById("keyboard");
const hiddenInput = document.getElementById("hiddenInput");

// Detect if mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Keyboard setup
const keyboardRows = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["Enter", ..."ZXCVBNM".split(""), "Backspace"]
];
const keyElements = {};

// Initialize board
function initBoard() {
  boardEl.innerHTML = "";
  board = [];
  for (let i = 0; i < BOARD_ROWS; i++) {
    const row = [];
    const rowEl = document.createElement("div");
    rowEl.className = "grid grid-cols-5 gap-3 mb-3";
    for (let j = 0; j < WORD_LENGTH; j++) {
      const cell = document.createElement("div");
      cell.className =
        "w-16 h-16 border border-gray-600 rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 hover:scale-105";
      rowEl.appendChild(cell);
      row.push(cell);
    }
    boardEl.appendChild(rowEl);
    board.push(row);
  }
}

// Initialize keyboard
function initKeyboard() {
  keyboardEl.innerHTML = "";
  keyboardRows.forEach((rowLetters, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.className = rowIndex < 2 ? "flex justify-center mb-2 space-x-2" : "flex items-center mb-2 space-x-2";

    rowLetters.forEach((letter) => {
      const key = document.createElement("button");
      key.textContent = letter === "Backspace" ? "⌫" : letter;
      key.dataset.key = letter;

      if (letter === "Enter") {
        key.className =
          "w-auto px-5 h-12 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center";
      } else if (letter === "Backspace") {
        key.className =
          "w-auto px-5 h-12 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition-colors flex items-center justify-center";
      } else {
        key.className =
          "w-10 h-12 bg-gray-700 rounded-md shadow-md hover:bg-gray-600 transition-colors flex items-center justify-center";
      }

      rowEl.appendChild(key);
      keyElements[letter] = key;

      key.addEventListener("click", async () => {
        handleInput(letter);
      });
    });

    // Move Enter & Backspace to the right on last row
    if (rowIndex === 2) {
      const lettersOnly = rowEl.querySelectorAll("button:not([data-key='Enter']):not([data-key='Backspace'])");
      const enterKey = rowEl.querySelector("button[data-key='Enter']");
      const backKey = rowEl.querySelector("button[data-key='Backspace']");
      rowEl.innerHTML = "";
      lettersOnly.forEach(btn => rowEl.appendChild(btn));

      const spacer = document.createElement("div");
      spacer.className = "flex-1"; // pushes Enter & Backspace right
      rowEl.appendChild(spacer);

      rowEl.appendChild(enterKey);
      rowEl.appendChild(backKey);
    }

    keyboardEl.appendChild(rowEl);
  });
}

// Show messages
function showMessage(msg, autoHide = true) {
  messageEl.textContent = msg;
  messageEl.classList.add("opacity-100");
  if (autoHide && msg) {
    setTimeout(() => { messageEl.classList.remove("opacity-100"); }, 2000);
  }
}

// Fetch random 5-letter word
async function fetchTargetWord() {
  try {
    const res = await fetch("https://random-word-api.vercel.app/api?words=1&length=5");
    const data = await res.json();
    targetWord = data[0].toLowerCase();
    console.log("Target word:", targetWord);
  } catch (err) {
    console.error("Failed to fetch word", err);
    showMessage("Failed to fetch word. Refresh to try again.", false);
  }
}

// Handle input
async function handleInput(key) {
  if (!targetWord) return;
  if (key === "Backspace") {
    if (currentCol > 0) {
      currentCol--;
      board[currentRow][currentCol].textContent = "";
    }
  } else if (key === "Enter") {
    if (currentCol === WORD_LENGTH) {
      const guess = board[currentRow].map(c => c.textContent).join("").toLowerCase();
      await checkGuess(guess);
    }
  } else if (/^[a-zA-Z]$/.test(key)) {
    if (currentCol < WORD_LENGTH) {
      board[currentRow][currentCol].textContent = key.toUpperCase();
      currentCol++;
    }
  }
}

// Check guess
async function checkGuess(guess) {
  if (guess.length !== WORD_LENGTH) {
    showMessage("Invalid word!");
    return;
  }
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`);
    if (res.status === 404) { showMessage("Not a valid word!"); return; }
  } catch { showMessage("Error validating word!"); return; }

  const targetArr = targetWord.split("");
  const guessArr = guess.split("");
  const color = Array(WORD_LENGTH).fill("bg-gray-500");

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) { color[i] = "bg-green-500"; targetArr[i] = null; guessArr[i] = null; }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] && targetArr.includes(guessArr[i])) { color[i] = "bg-yellow-500"; targetArr[targetArr.indexOf(guessArr[i])] = null; }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    const cell = board[currentRow][i];
    cell.classList.add("flip");
    setTimeout(() => { cell.classList.add(color[i]); cell.classList.remove("flip"); }, i*200);
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = guess[i].toUpperCase();
    if (letter && keyElements[letter]) {
      const key = keyElements[letter];
      if (color[i] === "bg-green-500") { key.classList.remove("bg-yellow-500","bg-gray-700"); key.classList.add("bg-green-500"); }
      else if (color[i] === "bg-yellow-500" && !key.classList.contains("bg-green-500")) { key.classList.remove("bg-gray-700"); key.classList.add("bg-yellow-500"); }
      else if (color[i] === "bg-gray-500" && !key.classList.contains("bg-green-500") && !key.classList.contains("bg-yellow-500")) { key.classList.add("bg-gray-500"); }
    }
  }

  if (guess === targetWord) { showMessage("🎉 Yay! You guessed it right!", false); return; }
  else if (currentRow === BOARD_ROWS - 1) { showMessage(`😢 Try again! Word was: ${targetWord.toUpperCase()}`, false); return; }
  else { currentRow++; currentCol = 0; }
}

// Desktop input
if (!isMobile) {
  document.addEventListener("keydown", async e => { await handleInput(e.key); });
}

// Mobile input
if (isMobile) {
  hiddenInput.addEventListener("input", e => {
    const value = e.target.value;
    const char = value.slice(-1);
    if (/^[a-zA-Z]$/.test(char)) handleInput(char);
    e.target.value = "";
  });
  hiddenInput.addEventListener("keydown", async e => {
    if (e.key === "Backspace" || e.key === "Enter") await handleInput(e.key);
  });
}

// Restart
restartBtn.addEventListener("click", () => location.reload());

// Initialize
(async function() { initBoard(); initKeyboard(); await fetchTargetWord(); })();
