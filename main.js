const BOARD_ROWS = 6;
const WORD_LENGTH = 5;
let currentRow = 0;
let currentCol = 0;
let board = [];
let targetWord = "";

const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

// Initialize empty board
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

// Show message, optionally auto-hide
function showMessage(msg, autoHide = true) {
  messageEl.textContent = msg;
  messageEl.classList.add("opacity-100");

  if (autoHide && msg) {
    setTimeout(() => {
      messageEl.classList.remove("opacity-100");
    }, 2000);
  }
}

// Fetch random 5-letter word from API
async function fetchTargetWord() {
  try {
    const res = await fetch(
      "https://random-word-api.vercel.app/api?words=1&length=5"
    );
    const data = await res.json();
    targetWord = data[0].toLowerCase();
    console.log("Target word:", targetWord);
  } catch (err) {
    console.error("Failed to fetch word", err);
    showMessage("Failed to fetch word. Refresh to try again.", false);
  }
}

// Check guess with dictionary API
async function checkGuess(guess) {
  if (guess.length !== WORD_LENGTH) {
    showMessage("Invalid word!");
    return;
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`
    );
    if (res.status === 404) {
      showMessage("Not a valid word!");
      return;
    }
  } catch (err) {
    console.error(err);
    showMessage("Error validating word!");
    return;
  }

  const targetArr = targetWord.split("");
  const guessArr = guess.split("");
  const color = Array(WORD_LENGTH).fill("bg-gray-500");

  // First pass for green
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      color[i] = "bg-green-500";
      targetArr[i] = null;
      guessArr[i] = null;
    }
  }

  // Second pass for yellow
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] && targetArr.includes(guessArr[i])) {
      color[i] = "bg-yellow-500";
      targetArr[targetArr.indexOf(guessArr[i])] = null;
    }
  }

  // Apply colors safely with flip animation
  for (let i = 0; i < WORD_LENGTH; i++) {
    const cell = board[currentRow][i];
    cell.classList.add("flip");
    setTimeout(() => {
      cell.classList.add(color[i]);
      cell.classList.remove("flip");
    }, i * 200); // stagger tiles
  }

  // Win / loss messages
  if (guess === targetWord) {
    showMessage("🎉 Yay! You guessed it right!", false);
    return;
  } else if (currentRow === BOARD_ROWS - 1) {
    showMessage(`😢 Try again! Word was: ${targetWord.toUpperCase()}`, false);
    return;
  } else {
    currentRow++;
    currentCol = 0;
  }
}

// Handle keyboard input
document.addEventListener("keydown", async (e) => {
  if (!targetWord) return;

  if (e.key === "Backspace") {
    if (currentCol > 0) {
      currentCol--;
      board[currentRow][currentCol].textContent = "";
    }
  } else if (e.key === "Enter") {
    if (currentCol === WORD_LENGTH) {
      const guess = board[currentRow]
        .map((c) => c.textContent)
        .join("")
        .toLowerCase();
      await checkGuess(guess);
    }
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    if (currentCol < WORD_LENGTH) {
      board[currentRow][currentCol].textContent = e.key.toUpperCase();
      currentCol++;
    }
  }
});

// Restart game
restartBtn.addEventListener("click", () => {
  location.reload();
});

// Initialize game
(async function () {
  initBoard();
  await fetchTargetWord();
})();
