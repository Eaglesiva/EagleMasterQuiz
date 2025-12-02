/* ==========================================================
   LEO QUIZ PLAYER ENGINE — V6.3
   Auto-next, auto-voice, timer, haptic vibration, score UI
   Created by 🦅 Eaglesiva
=========================================================== */

export function startPlayer(PLAYER_DATA) {
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
  const app = document.getElementById("leoApp");
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

  const btnStart = document.getElementById("startBtn");
  const btnPlayAgain = document.getElementById("againBtn");
  const btnHome = document.getElementById("homeBtn");

  let qIndex = 0;
  let score = 0;
  let timerLeft = 0;
  let timerInterval = null;
  let voiceEnabled = voice;
  let soundEnabled = sound;

  /* SET TEXTS */
  elTitle.textContent = title;
  elBadge.textContent = badge;
  elAbout.innerHTML = about;
  elFooter.innerHTML = footer;

  /* APPLY BG IMAGE */
  if (bgImage) {
    document.body.style.background = `url(${bgImage}) center/cover no-repeat fixed`;
  }

  /* ICON */
  if (iconUrl) {
    document.getElementById("pIcon").style.backgroundImage = `
