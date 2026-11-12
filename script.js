
const startScreen = document.getElementById("start-screen");
const chooseScreen = document.getElementById("choose-screen");
const gameScreen = document.getElementById("game-container");
const victoryScreen = document.getElementById("victory-screen");

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const playAgainBtn = document.getElementById("play-again-btn");

const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const progressFill = document.getElementById("progress-fill");
const remainingEl = document.getElementById("remaining");
const finalTimeEl = document.getElementById("final-time");
const messageEl = document.getElementById("message");
const catchNet = document.getElementById("catch-net");

const GOAL = 100;

let score = 0;
let seconds = 0;
let timer = null;
let selectedInsect = "bee";
let playing = false;
let messageTimeout = null;

const insectImages = {
  bee: "bugs/bee.png",
  cicada: "bugs/cicada.png",
  butterfly: "bugs/butterfly.png",
  moth: "bugs/moth.png",
  beetle: "bugs/beetle.png"
};


// SWITCH SCREENS
function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((item) => {
    item.classList.remove("active");
  });

  screen.classList.add("active");
}


// FORMAT TIME
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}


// UPDATE GAME DISPLAY
function updateDisplay() {
  scoreEl.textContent = `Bugs Caught: ${score} / ${GOAL}`;
  timeEl.textContent = `Time: ${formatTime(seconds)}`;

  const percentage = (score / GOAL) * 100;
  progressFill.style.width = percentage + "%";

  const remaining = GOAL - score;
  remainingEl.textContent = `${remaining} bugs remaining`;
}


// CLEAR EXISTING BUGS
function clearBugs() {
  document.querySelectorAll(".insect").forEach((bug) => {
    bug.remove();
  });
}


// STOP GAME TIMERS
function stopTimers() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }

  if (messageTimeout !== null) {
    clearTimeout(messageTimeout);
    messageTimeout = null;
  }
}


// START BUTTON
startBtn.addEventListener("click", () => {
  showScreen(chooseScreen);
});


// INSECT SELECTION
document.querySelectorAll(".choose-insect-btn").forEach((button) => {
  button.addEventListener("click", () => {
    selectedInsect = button.dataset.insect;
    startGame();
  });
});


// START GAME
function startGame() {
  stopTimers();
  clearBugs();

  score = 0;
  seconds = 0;
  playing = true;

  messageEl.style.display = "none";
  catchNet.classList.remove("swing");

  updateDisplay();
  showScreen(gameScreen);

  timer = setInterval(() => {
    if (!playing) return;

    seconds++;
    updateDisplay();
  }, 1000);

  // Start with 5 bugs
  for (let i = 0; i < 5; i++) {
    createBug();
  }
}


// CREATE A BUG
function createBug() {
  if (!playing) return;

  const bug = document.createElement("div");
  bug.classList.add("insect");

  const img = document.createElement("img");
  img.src = insectImages[selectedInsect];
  img.alt = selectedInsect;

  bug.appendChild(img);

  // Keep bugs inside the game screen
  const bugSize = window.innerWidth <= 600 ? 60 : 80;

  const maxX = Math.max(
    0,
    gameScreen.clientWidth - bugSize
  );

  const safeTop = Math.min(
    240,
    Math.max(0, gameScreen.clientHeight - bugSize)
  );

  const maxY = Math.max(
    safeTop,
    gameScreen.clientHeight - bugSize
  );

  const x = Math.random() * maxX;
  const y = safeTop + Math.random() * (maxY - safeTop);

  bug.style.left = x + "px";
  bug.style.top = y + "px";

  bug.addEventListener("click", () => {
    catchBug(bug);
  });

  gameScreen.appendChild(bug);
}


// CATCH A BUG
function catchBug(bug) {
  if (!playing || bug.classList.contains("caught")) {
    return;
  }

  bug.classList.add("caught");

  // Position the net where the bug was clicked
  const bugRect = bug.getBoundingClientRect();
  const gameRect = gameScreen.getBoundingClientRect();

  const x = bugRect.left - gameRect.left + bugRect.width / 2;
  const y = bugRect.top - gameRect.top + bugRect.height / 2;

  animateNet(x, y);
  playSwoosh();

  score++;
  updateDisplay();

  setTimeout(() => {
    bug.remove();
  }, 350);

  // WIN AT 100 BUGS
  if (score >= GOAL) {
    winGame();
    return;
  }

  // Encouraging messages
  if (score === 25) {
    showMessage("🌼 Great job! 25 bugs caught!");
  }

  if (score === 50) {
    showMessage("🦋 Halfway there! 50 bugs!");
  }

  if (score === 75) {
    showMessage("🌿 Almost there! 75 bugs!");
  }

  // Replace caught bugs and gradually add more
  createBug();

  if (score % 10 === 0) {
    createBug();
  }
}


// ANIMATE THE NET
function animateNet(x, y) {
  catchNet.style.left = x + "px";
  catchNet.style.top = y + "px";

  catchNet.classList.remove("swing");

  // Restart the animation
  void catchNet.offsetWidth;

  catchNet.classList.add("swing");
}


// SWOOSH SOUND
function playSwoosh() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    const duration = 0.18;
    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);

    const buffer = audioContext.createBuffer(
      1,
      length,
      sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;

    const volume = audioContext.createGain();
    volume.gain.value = 0.12;

    source.connect(filter);
    filter.connect(volume);
    volume.connect(audioContext.destination);

    source.start();
    source.stop(audioContext.currentTime + duration);

    source.onended = () => {
      audioContext.close();
    };

  } catch (error) {
    console.log("Sound unavailable:", error);
  }
}


// SHOW ENCOURAGING MESSAGE
function showMessage(text) {
  messageEl.textContent = text;
  messageEl.style.display = "block";

  if (messageTimeout !== null) {
    clearTimeout(messageTimeout);
  }

  messageTimeout = setTimeout(() => {
    messageEl.style.display = "none";
    messageTimeout = null;
  }, 1800);
}


// WIN GAME
function winGame() {
  playing = false;
  stopTimers();

  finalTimeEl.textContent =
    `Your Time: ${formatTime(seconds)}`;

  updateDisplay();
  clearBugs();

  // Show the victory screen after a short pause
  setTimeout(() => {
    showScreen(victoryScreen);
  }, 450);
}


// RESET GAME
function resetGame() {
  playing = false;
  stopTimers();
  clearBugs();

  score = 0;
  seconds = 0;

  messageEl.style.display = "none";
  catchNet.classList.remove("swing");

  updateDisplay();

  // Return to insect selection
  showScreen(chooseScreen);
}


// RESET BUTTON DURING GAME
resetBtn.addEventListener("click", resetGame);


// PLAY AGAIN BUTTON AFTER WINNING
playAgainBtn.addEventListener("click", resetGame);


// INITIAL DISPLAY
updateDisplay();
