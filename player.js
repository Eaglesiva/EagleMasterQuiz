/* ==========================================================
   LEO QUIZ PLAYER ENGINE — V6.3
   Auto-next, auto-voice, timer, haptic vibration, score UI
   Created by 🦅 Eaglesiva
=========================================================== */

export function startPlayer(PLAYER_DATA) {
  // STEP 1: Build HTML structure inside #leoApp
  const container = document.getElementById("leoApp");
  if (!container) {
    console.error("Leo Quiz Player: #leoApp container not found.");
    return;
  }

  container.innerHTML = `
    <div class="app">
      <header>
        <div id="pIcon"></div>
        <div>
          <div id="pTitle"></div>
          <div id="pBadge"></div>
        </div>
      </header>

      <!-- MENU SCREEN -->
      <section id="screenMenu" class="screen active">
        <h2>Welcome!</h2>
        <p id="aboutText"></p>
        <button id="startBtn">🚀 Start Quiz</button>
        <p id="footerText"></p>
      </section>

      <!-- QUIZ SCREEN -->
      <section id="screenQuiz" class="screen">
        <div id="scoreTimerBar">
          <span id="scoreBox">Score: 0</span>
          <span id="timerBox">00:00</span>
        </div>

        <div id="progressContainer">
          <div id="progressBar"></div>
        </div>

        <div id="qText"></div>
        <div id="optionsBox"></div>
      </section>

      <!-- RESULT SCREEN -->
      <section id="screenResult" class="screen">
        <div id="resultHeader">
          <h2>🎉 Quiz Complete!</h2>
        </div>
        <div id="finalScore"></div>
        <div id="resultButtons"></div>
        <div id="resultActions">
          <button id="againBtn">▶ Play Again</button>
          <button id="homeBtn">🏠 Back to Menu</button>
        </div>
      </section>
    </div>
  `;

  // Now safely destructure data (STEP 2 uses these)
  const {
    title,
    badge,
    about,
    footer,
    themePreset,
    themeMode,
    timer,
    voice,
    sound,
    fullscreen,
    autoNext,
    bgImage,
    iconUrl,
    resultButtons,
    questions
  } = PLAYER_DATA;

  /* ROOT DOM */
  const app = container; // #leoApp is our app root
  const scrMenu = document.getElementById("screenMenu");
  const scrQuiz = document.getElementById("screenQuiz");
  const scrRes = document.getElementById("screenResult");

  const elTitle = document.getElementById("pTitle");
  const elBadge = document.getElementById("pBadge");
  const elQ = document.getElementById("qText");
  const elOpts = document.getElementById("optionsBox");
  const elProgress = document.getElementById("progressBar");
  const elScore = document.getElementById("scoreBox");
  const elTimer = document.getElementById("timerBox");
  const elAbout = document.getElementById("aboutText");
  const elFooter = document.getElementById("footerText");
  const elBtns = document.getElementById("resultButtons");
  const elIcon = document.getElementById("pIcon");
  const elFinalScore = document.getElementById("finalScore");

  const btnStart = document.getElementById("startBtn");
  const btnPlayAgain = document.getElementById("againBtn");
  const btnHome = document.getElementById("homeBtn");

  /* STATE */
  let qIndex = 0;
  let score = 0;
  let timerLeft = timer || 60; // Use timer from data, default to 60 if not set
  let timerInterval = null;
  let voiceEnabled = voice !== undefined ? voice : true;
  let soundEnabled = sound !== undefined ? sound : true;
  let isLocked = false; // Prevents double clicking options

  const TOTAL_QUESTIONS = questions.length;

  /* UTILITY FUNCTIONS */

  // Haptic feedback for interaction
  function vibrate(duration = 100) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  // Audio feedback (expects audio elements in exported player if you add them)
  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const audio = document.getElementById(type + "Sound");
      if (audio) audio.play();
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }

  // Text-to-Speech
  function speak(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.cancel(); // Stop any current speech
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Could not use speech synthesis:", e);
    }
  }

  /* TIMER LOGIC */

  function updateTimerDisplay() {
    const minutes = Math.floor(timerLeft / 60).toString().padStart(2, "0");
    const seconds = (timerLeft % 60).toString().padStart(2, "0");
    elTimer.textContent = `${minutes}:${seconds}`;
  }

  function startTimer() {
    if (!timer) {
      elTimer.style.display = "none";
      return;
    }
    elTimer.style.display = "flex";
    timerLeft = timer; // Reset timer
    updateTimerDisplay();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => (
      timerLeft--,
      updateTimerDisplay(),
      timerLeft <= 5 && (elTimer.classList.add("text-red-500"), vibrate(300)),
      timerLeft <= 0 && (stopTimer(), selectOption(null, true))
    ), 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    elTimer.classList.remove("text-red-500");
  }

  /* NAVIGATION & UI */

  function updateProgressBar() {
    const percent = ((qIndex / TOTAL_QUESTIONS) * 100).toFixed(0);
    elProgress.style.width = `${percent}%`;
  }

  function updateScoreDisplay() {
    elScore.textContent = `Score: ${score}`;
  }

  function nextQuestion() {
    stopTimer();
    qIndex++;
    if (qIndex < TOTAL_QUESTIONS) {
      renderQuestion(questions[qIndex]);
    } else {
      showResult();
    }
  }

  // STEP 2: Fix property names to match core.js
  function renderQuestion(q) {
    // Reset state
    isLocked = false;
    elOpts.innerHTML = "";

    // Update progress
    updateProgressBar();
    updateScoreDisplay();

    // Start timer for new question
    startTimer();

    // Question text and voice (core.js uses q.q)
    elQ.textContent = q.q;
    speak(q.q);

    // Render options (core.js gives plain strings)
    q.options.forEach((opt, index) => {
      const optEl = document.createElement("button");
      optEl.className =
        "w-full p-3 mb-3 bg-white/10 text-left rounded-lg transition-colors hover:bg-white/20 active:scale-[0.98] transform duration-150 shadow-md backdrop-blur-sm";
      optEl.textContent = opt; // opt is string now
      optEl.dataset.index = index;
      optEl.onclick = () => selectOption(index);
      elOpts.appendChild(optEl);
    });

    // Show quiz screen
    scrMenu.style.display = "none";
    scrRes.style.display = "none";
    scrQuiz.style.display = "block";
  }

  function selectOption(selectedIndex, isTimeUp = false) {
    if (isLocked) return;
    isLocked = true; // Lock controls

    stopTimer(); // Stop the timer immediately

    const currentQuestion = questions[qIndex];
    const isCorrect =
      !isTimeUp && currentQuestion.correctIndex === selectedIndex; // FIXED NAME
    const options = elOpts.children;

    vibrate(isCorrect ? 50 : 200);

    // Visually mark correct/incorrect
    for (let i = 0; i < options.length; i++) {
      const optEl = options[i];
      optEl.disabled = true; // Disable all buttons
      optEl.classList.remove("bg-white/10", "hover:bg-white/20");

      if (i === currentQuestion.correctIndex) {
        // Always highlight the correct answer
        optEl.classList.add("bg-green-600", "text-white");
      } else if (i === selectedIndex) {
        // Highlight the user's incorrect choice
        optEl.classList.add("bg-red-600", "text-white");
      } else {
        // Dim other incorrect choices
        optEl.classList.add("opacity-50");
      }
    }

    if (isCorrect) {
      score++;
      playSound("correct");
      speak("Correct!");
    } else {
      playSound("incorrect");
      if (isTimeUp) {
        speak("Time up! The correct answer was...");
      } else {
        speak("Incorrect. The correct answer was...");
      }
    }

    // Move to next question logic
    if (autoNext) {
      setTimeout(nextQuestion, 1500); // 1.5 second delay for review
    } else {
      // If autoNext is false, show a "Next" button
      setTimeout(() => {
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next Question";
        nextBtn.className =
          "w-full mt-6 p-4 bg-yellow-500 text-white font-bold rounded-lg shadow-xl hover:bg-yellow-600 transition-colors active:scale-[0.99]";
        nextBtn.onclick = nextQuestion;
        elOpts.appendChild(nextBtn);
        isLocked = false; // Allow interaction only for the next button
      }, 1500);
    }
  }

  function showResult() {
    stopTimer();

    // Calculate final percentage
    const percentage = ((score / TOTAL_QUESTIONS) * 100).toFixed(1);

    // Determine feedback text
    let feedback = "";
    if (percentage === "100.0") {
      feedback = "Perfect Score! Amazing job!";
    } else if (percentage >= 70) {
      feedback = "Great work! You scored high!";
    } else if (percentage >= 50) {
      feedback = "Good effort. Keep practicing!";
    } else {
      feedback = "Time to hit the books. Try again!";
    }

    elFinalScore.innerHTML = `
      <div class="text-4xl font-extrabold mb-2">${score} / ${TOTAL_QUESTIONS}</div>
      <div class="text-6xl font-black mb-4 text-yellow-400">${percentage}%</div>
      <div class="text-xl text-white/80">${feedback}</div>
    `;

    // Apply custom buttons if provided
    if (resultButtons && resultButtons.length > 0) {
      elBtns.innerHTML = resultButtons
        .map(
          (btn) => `
            <button onclick="window.open('${btn.url}', '_blank')" class="w-full mt-3 p-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors">${btn.text}</button>
          `
        )
        .join("");
    } else {
      elBtns.innerHTML = "";
    }

    // Show result screen
    scrMenu.style.display = "none";
    scrQuiz.style.display = "none";
    scrRes.style.display = "block";

    // Say final score
    speak(
      `You finished the quiz! Your score is ${score} out of ${TOTAL_QUESTIONS}. ${feedback}`
    );
  }

  /* INITIALIZATION */

  function startQuiz() {
    // Reset state
    qIndex = 0;
    score = 0;
    elProgress.style.width = "0%";

    // Start with the first question
    renderQuestion(questions[qIndex]);
  }

  function resetApp() {
    // Reset progress bar visually
    elProgress.style.width = "0%";

    // Show menu screen
    scrQuiz.style.display = "none";
    scrRes.style.display = "none";
    scrMenu.style.display = "block";
  }

  function init() {
    /* APPLY UI CONFIG */
    elTitle.textContent = title;
    elBadge.textContent = badge;
    elAbout.innerHTML = about;
    elFooter.innerHTML = footer;

    // Apply BG Image
    if (bgImage) {
      document.body.style.background = `url('${bgImage}') center/cover no-repeat fixed`;
      document.body.classList.add("text-shadow");
    }

    // Apply Icon
    if (iconUrl && elIcon) {
      elIcon.style.backgroundImage = `url('${iconUrl}')`;
      elIcon.style.backgroundSize = "cover";
      elIcon.style.backgroundPosition = "center";
    }

    // Apply Theme preset (class on #leoApp)
    if (themePreset) {
      app.className = app.className
        .split(" ")
        .filter((c) => !c.startsWith("theme-"))
        .join(" ");
      app.classList.add(`theme-${themePreset}`);
    }

    // Apply Theme Mode (for player CSS)
    if (themeMode === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    // Hide timer if not configured
    if (!timer) {
      elTimer.style.display = "none";
    }

    /* ATTACH EVENT LISTENERS */
    btnStart.onclick = startQuiz;
    btnPlayAgain.onclick = startQuiz;
    btnHome.onclick = resetApp;

    // Initial view
    resetApp();

    // Check if questions exist
    if (!questions || questions.length === 0) {
      elAbout.innerHTML +=
        '<p class="text-red-400 mt-4">Error: No questions found in quiz data. Please check the `questions` array.</p>';
      btnStart.disabled = true;
    }
  }

  // Kick off the initialization
  init();
}
