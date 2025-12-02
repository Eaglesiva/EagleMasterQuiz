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

  // STEP 2: Destructure PLAYER_DATA
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

  // STEP 3: STATE
  let qIndex = 0;
  let score = 0;
  const hasTimer = typeof timer === "number" && timer > 0;
  let timerLeft = hasTimer ? timer : 60; // 0 = no timer, but we still keep a base value
  let timerInterval = null;
  let voiceEnabled = (voice !== undefined) ? voice : true;
  let soundEnabled = (sound !== undefined) ? sound : true;
  let isLocked = false;
  const TOTAL_QUESTIONS = Array.isArray(questions) ? questions.length : 0;
  const autoNextEnabled = !!autoNext;

  if (!TOTAL_QUESTIONS) {
    console.error("Leo Quiz Player: No questions found in PLAYER_DATA.");
  }

  /* ==========================================================
     UTILITY FUNCTIONS
  ========================================================== */

  function vibrate(duration = 40) {
    if (navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration);
    }
  }

  function playSound(type = "click") {
    if (!soundEnabled) return;
    // Simple built-in beep using AudioContext (no external files)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let freq = 440;
      if (type === "correct") freq = 660;
      else if (type === "wrong") freq = 220;
      else if (type === "timeup") freq = 150;

      osc.frequency.value = freq;
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      // ignore audio errors silently
    }
  }

  function speak(text) {
    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window)) return;

    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // ignore
    }
  }

  /* ==========================================================
     TIMER LOGIC
  ========================================================== */

  function updateTimerDisplay() {
    if (!elTimer) return;
    if (!hasTimer) {
      elTimer.textContent = "--:--";
      return;
    }
    const total = Math.max(timerLeft, 0);
    const m = Math.floor(total / 60);
    const s = total % 60;
    elTimer.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer() {
    stopTimer();

    if (!hasTimer) {
      updateTimerDisplay();
      return;
    }

    timerLeft = timer > 0 ? timer : 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timerLeft--;
      updateTimerDisplay();

      if (timerLeft <= 0) {
        stopTimer();
        // Time up: lock and show correct answer
        selectOption(-1, true);
      }
    }, 1000);
  }

  /* ==========================================================
     NAVIGATION / RENDER
  ========================================================== */

  function updateProgressBar() {
    if (!elProgress || TOTAL_QUESTIONS === 0) return;
    const progress = ((qIndex) / TOTAL_QUESTIONS) * 100;
    elProgress.style.width = `${progress}%`;
  }

  function updateScoreDisplay() {
    if (!elScore) return;
    elScore.textContent = `Score: ${score}`;
  }

  function renderQuestion(q) {
    if (!q || !elQ || !elOpts) return;

    // Question text (NOTE: property is q.q)
    elQ.textContent = q.q || "";

    // Clear old options
    elOpts.innerHTML = "";

    const opts = q.options || [];
    opts.forEach((opt, idx) => {
      const btn = document.createElement("button");
      // options are plain strings
      btn.textContent = opt;
      btn.dataset.index = String(idx);
      btn.addEventListener("click", () => {
        selectOption(idx, false);
      });
      elOpts.appendChild(btn);
    });

    // Voice narration: question + options
    const voiceText = `${q.q}. Options: ${opts.join(", ")}`;
    speak(voiceText);

    updateProgressBar();
    updateScoreDisplay();
    updateTimerDisplay();
  }

  function nextQuestion() {
    qIndex++;
    if (qIndex >= TOTAL_QUESTIONS) {
      showResult();
      return;
    }
    isLocked = false;
    renderQuestion(questions[qIndex]);
    startTimer();
  }

  function selectOption(selectedIndex, isTimeUp = false) {
    if (isLocked || !Array.isArray(questions) || !questions[qIndex]) return;
    isLocked = true;
    stopTimer();

    const currentQuestion = questions[qIndex];
    // NOTE: property is correctIndex
    const correctIndex = currentQuestion.correctIndex;

    const optionButtons = elOpts ? elOpts.querySelectorAll("button") : [];

    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.add("opacity-50");
      btn.style.cursor = "default";

      if (idx === correctIndex) {
        btn.classList.add("bg-green-600");
        btn.classList.remove("opacity-50");
      }
    });

    if (!isTimeUp && selectedIndex === correctIndex) {
      score++;
      vibrate(40);
      playSound("correct");
    } else if (isTimeUp) {
      vibrate(80);
      playSound("timeup");
    } else {
      vibrate(80);
      playSound("wrong");
      // highlight wrong selection
      if (selectedIndex >= 0 && optionButtons[selectedIndex]) {
        optionButtons[selectedIndex].classList.add("bg-red-600");
        optionButtons[selectedIndex].classList.remove("opacity-50");
      }
    }

    updateScoreDisplay();

    if (autoNextEnabled) {
      setTimeout(() => {
        if (qIndex < TOTAL_QUESTIONS - 1) {
          nextQuestion();
        } else {
          showResult();
        }
      }, 800);
    }
  }

  function showScreen(target) {
    [scrMenu, scrQuiz, scrRes].forEach((scr) => {
      if (!scr) return;
      scr.classList.remove("active");
    });
    if (target) {
      target.classList.add("active");
    }
  }

  function showResult() {
    stopTimer();
    if (voiceEnabled) {
      speak(`Quiz complete. Your score is ${score} out of ${TOTAL_QUESTIONS}.`);
    }

    showScreen(scrRes);

    const percent = TOTAL_QUESTIONS > 0
      ? Math.round((score / TOTAL_QUESTIONS) * 100)
      : 0;

    if (elFinalScore) {
      elFinalScore.innerHTML = `
        <h3>Your Score</h3>
        <p style="font-size:2.4rem;font-weight:900;margin:6px 0;">${score} / ${TOTAL_QUESTIONS}</p>
        <p style="font-size:1.1rem;">${percent}% correct</p>
      `;
    }

    // Render result buttons from config
    if (elBtns) {
      elBtns.innerHTML = "";
      const btnConfig = Array.isArray(resultButtons) ? resultButtons : [];
      if (btnConfig.length === 0) {
        elBtns.style.display = "none";
      } else {
        elBtns.style.display = "flex";
        btnConfig.forEach((cfg) => {
          if (!cfg || !cfg.text) return;
          const b = document.createElement("button");
          b.textContent = cfg.text;
          b.addEventListener("click", () => {
            if (cfg.url) {
              window.open(cfg.url, "_blank");
            }
          });
          elBtns.appendChild(b);
        });
      }
    }
  }

  /* ==========================================================
     INIT / RESET / START
  ========================================================== */

  function resetApp() {
    stopTimer();
    isLocked = false;
    qIndex = 0;
    score = 0;
    updateScoreDisplay();
    updateProgressBar();
    updateTimerDisplay();
    showScreen(scrMenu);
  }

  function applyThemeAndConfig() {
    // Title + Badge + Texts
    if (elTitle) elTitle.textContent = title || "Leo Quiz";
    if (elBadge) elBadge.textContent = badge || "";
    if (elAbout) elAbout.innerHTML = about || "";
    if (elFooter) elFooter.textContent = footer || "";

    // Theme mode (player)
    if (themeMode === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    // Theme preset colors (accent)
    const root = document.documentElement;
    const preset = themePreset || "green";
    let accent = "#22c55e";
    let accentDark = "#16a34a";

    if (preset === "blue") {
      accent = "#3b82f6";
      accentDark = "#2563eb";
    } else if (preset === "purple") {
      accent = "#a855f7";
      accentDark = "#7c3aed";
    } else if (preset === "orange") {
      accent = "#f97316";
      accentDark = "#ea580c";
    }

    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-dark", accentDark);

    // Background image (body)
    if (bgImage) {
      document.body.style.backgroundImage = `url("${bgImage}")`;
      document.body.classList.add("text-shadow");
    }

    // Icon
    if (elIcon) {
      if (iconUrl) {
        elIcon.style.backgroundImage = `url("${iconUrl}")`;
        elIcon.style.backgroundSize = "cover";
        elIcon.style.backgroundPosition = "center";
      }
    }
  }

  function requestFullscreenIfNeeded() {
    if (!fullscreen) return;
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  function startQuiz() {
    if (!TOTAL_QUESTIONS) return;
    qIndex = 0;
    score = 0;
    isLocked = false;

    updateScoreDisplay();
    updateProgressBar();

    showScreen(scrQuiz);
    requestFullscreenIfNeeded();

    renderQuestion(questions[qIndex]);
    startTimer();
  }

  function init() {
    applyThemeAndConfig();
    resetApp();

    if (btnStart) {
      btnStart.addEventListener("click", () => {
        playSound("click");
        startQuiz();
      });
    }

    if (btnPlayAgain) {
      btnPlayAgain.addEventListener("click", () => {
        vibrate(30);
        startQuiz();
      });
    }

    if (btnHome) {
      btnHome.addEventListener("click", () => {
        vibrate(20);
        resetApp();
      });
    }
  }

  // IMPORTANT: Call init() at the end
  init();
}
