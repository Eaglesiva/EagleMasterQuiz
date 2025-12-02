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
  const elBadge = document.getEl
