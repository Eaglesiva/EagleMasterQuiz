/* ==========================================================
   EAGLE QUIZ MAKER PRO — UI CONTROLLER (V6.3)
   Handles preview + export + form + storage + quiz library
   Created by 🦅 Eaglesiva
=========================================================== */

import { parseQuiz } from "./core.js";
import { startPlayer } from "./player.js"; // used inside generated preview HTML

const STORAGE_KEY = "eagle_quiz_maker_pro_v63";

/* STEP 4: localStorage initialization */
(function initStorage() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const defaultData = {
      lastForm: {
        playerTitle: "Leo Quiz",
        timer: 0,
        autoNext: true,
        voice: true,
        sound: true,
        fullscreen: false,
        title: "Leo Quiz",
        badge: "V6.1 PRO",
        themeMode: "dark",
        themePreset: "green",
        about: "Welcome to Leo Quiz!",
        footer: "Powered by Leo 🐾",
        bgImage: "",
        iconUrl: "",
        resultButtons: [],
        questions: []
      },
      savedQuizzes: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  }
})();

function getStorage() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}
function setStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* DOM references */
const txtQuestions = document.getElementById("quizQuestions");
const txtQuizTitle = document.getElementById("quizTitle");
const txtQuizDescription = document.getElementById("quizDescription");
const quizList = document.getElementById("quizList");
const statusBar = document.getElementById("statusBar");

const inputPlayerTitle = document.getElementById("playerTitle");
const inputTitle = document.getElementById("title");
const inputBadge = document.getElementById("badge");
const inputTimer = document.getElementById("timer");
const inputAutoNext = document.getElementById("autoNext");
const inputVoice = document.getElementById("voice");
const inputSound = document.getElementById("sound");
const inputFullscreen = document.getElementById("fullscreen");
const inputThemeMode = document.getElementById("themeMode");
const inputThemePreset = document.getElementById("themePreset");
const inputAbout = document.getElementById("about");
const inputFooter = document.getElementById("footer");
const inputBgImage = document.getElementById("bgImage");
const inputIconUrl = document.getElementById("iconUrl");
const txtResultButtons = document.getElementById("resultButtons");

/* Buttons */
const btnPreviewHeader = document.getElementById("previewBtnHeader");
const btnExportHeader = document.getElementById("exportBtnHeader");
const btnExportMain = document.getElementById("exportBtnMain");
const btnPreviewQuiz = document.getElementById("btnPreviewQuiz");
const btnSaveDesign = document.getElementById("btnSaveDesign");
const btnSaveQuiz = document.getElementById("btnSaveQuiz");
const btnNewQuiz = document.getElementById("btnNewQuiz");
const btnExportJson = document.getElementById("btnExportJson");
const btnImportJson = document.getElementById("btnImportJson");
const inputImportFile = document.getElementById("importFile");

/* Helper for logs */
function status(msg) {
  if (statusBar) statusBar.textContent = msg;
  else console.log(msg);
}

/* ==========================================================
   STEP 6: Save / Load form (Design & behavior)
========================================================== */

function saveFormToLocalStorage() {
  const data = getStorage();
  if (!data) return;

  // Gather values safely
  const timerVal = inputTimer ? parseInt(inputTimer.value || "0", 10) || 0 : 0;

  // Result buttons JSON
  let resultButtonsArray = [];
  const rbText = txtResultButtons ? txtResultButtons.value.trim() : "";
  if (rbText) {
    try {
      const parsed = JSON.parse(rbText);
      if (Array.isArray(parsed)) {
        resultButtonsArray = parsed;
      }
    } catch (err) {
      console.warn("Result buttons JSON invalid, using empty array.", err);
      resultButtonsArray = [];
    }
  }

  data.lastForm = {
    playerTitle: inputPlayerTitle?.value || "Leo Quiz",
    timer: timerVal,
    autoNext: !!(inputAutoNext && inputAutoNext.checked),
    voice: !!(inputVoice && inputVoice.checked),
    sound: !!(inputSound && inputSound.checked),
    fullscreen: !!(inputFullscreen && inputFullscreen.checked),
    title: inputTitle?.value || "Leo Quiz",
    badge: inputBadge?.value || "V6.1 PRO",
    themeMode: inputThemeMode?.value || "dark",
    themePreset: inputThemePreset?.value || "green",
    about: inputAbout?.value || "Welcome to Leo Quiz!",
    footer: inputFooter?.value || "Powered by Leo 🐾",
    bgImage: inputBgImage?.value || "",
    iconUrl: inputIconUrl?.value || "",
    resultButtons: resultButtonsArray,
    questions: data.lastForm?.questions || [] // keep previous parsed questions
  };

  setStorage(data);
  status("✅ Settings saved!");
}

function loadFormFromLocalStorage() {
  const data = getStorage();
  if (!data || !data.lastForm) return;
  const f = data.lastForm;

  if (inputPlayerTitle) inputPlayerTitle.value = f.playerTitle ?? "";
  if (inputTitle) inputTitle.value = f.title ?? "";
  if (inputBadge) inputBadge.value = f.badge ?? "";
  if (inputTimer) inputTimer.value = f.timer ?? 0;

  if (inputAutoNext) inputAutoNext.checked = !!f.autoNext;
  if (inputVoice) inputVoice.checked = !!f.voice;
  if (inputSound) inputSound.checked = !!f.sound;
  if (inputFullscreen) inputFullscreen.checked = !!f.fullscreen;

  if (inputThemeMode) inputThemeMode.value = f.themeMode ?? "dark";
  if (inputThemePreset) inputThemePreset.value = f.themePreset ?? "green";

  if (inputAbout) inputAbout.value = f.about ?? "";
  if (inputFooter) inputFooter.value = f.footer ?? "";
  if (inputBgImage) inputBgImage.value = f.bgImage ?? "";
  if (inputIconUrl) inputIconUrl.value = f.iconUrl ?? "";

  if (txtResultButtons) {
    txtResultButtons.value = JSON.stringify(f.resultButtons || [], null, 2);
  }
}

/* Attach Save Design button */
if (btnSaveDesign) {
  btnSaveDesign.addEventListener("click", () => {
    saveFormToLocalStorage();
  });
}

/* ==========================================================
   STEP 7: Quiz Save / Load / Delete system
========================================================== */

function saveQuiz() {
  const title = (txtQuizTitle?.value || "").trim();
  const description = (txtQuizDescription?.value || "").trim();
  const questionsText = txtQuestions?.value || "";

  if (!title) {
    status("❌ Please enter a quiz title");
    return;
  }

  const quizData = parseQuiz(questionsText);
  if (!quizData.ok) {
    status("❌ Invalid question format");
    return;
  }

  const storage = getStorage();
  if (!storage) return;

  const newQuiz = {
    id: Date.now(),
    title,
    description,
    questions: quizData.questions,
    createdAt: new Date().toISOString()
  };

  storage.savedQuizzes = storage.savedQuizzes || [];
  storage.savedQuizzes.push(newQuiz);

  // Also update lastForm.questions to this latest parsed quiz
  storage.lastForm.questions = quizData.questions;

  setStorage(storage);
  renderQuizList();
  status("✅ Quiz saved successfully!");
}

function renderQuizList() {
  if (!quizList) return;

  const storage = getStorage();
  const quizzes = storage?.savedQuizzes || [];

  quizList.innerHTML = "";

  if (quizzes.length === 0) {
    quizList.innerHTML = `<p class="panel-help">No saved quizzes yet.</p>`;
    return;
  }

  quizzes.forEach((quiz) => {
    const div = document.createElement("div");
    div.className = "quiz-item";

    const created = new Date(quiz.createdAt);
    const dateStr = created.toLocaleString();

    div.innerHTML = `
      <strong>${quiz.title}</strong><br>
      <small>${quiz.questions.length} questions • ${dateStr}</small>
      <button class="ghost-btn small" style="float:right;margin-top:4px;">🗑️ Delete</button>
    `;

    const deleteBtn = div.querySelector("button");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Custom confirmation instead of window.confirm
        const isConfirmed = confirmDelete(quiz.title); 
        if (isConfirmed) {
            deleteQuiz(quiz.id);
        }
      });
    }

    div.addEventListener("click", () => {
      loadQuiz(quiz.id);
    });

    quizList.appendChild(div);
  });
}

/**
 * Custom confirmation handler (since window.confirm is disabled).
 * In a real application, this would show a custom modal.
 * For this environment, we log a warning and assume confirmation for deletion to proceed with the logic.
 * Note: If the environment doesn't allow window.confirm, this is the best fallback.
 */
function confirmDelete(quizTitle) {
    console.warn(`Confirming deletion of quiz: ${quizTitle}. (Using console confirmation/assumption as window.confirm is restricted)`);
    // In a production environment, you would use a custom modal UI here.
    // For this demonstration, we'll assume 'yes' to show the delete logic works.
    return true; 
}


function loadQuiz(quizId) {
  const storage = getStorage();
  if (!storage || !storage.savedQuizzes) return;

  const quiz = storage.savedQuizzes.find((q) => q.id === quizId);
  if (!quiz) {
    status("❌ Quiz not found");
    return;
  }

  if (txtQuizTitle) txtQuizTitle.value = quiz.title || "";
  if (txtQuizDescription) txtQuizDescription.value = quiz.description || "";

  // Convert questions array back to text format:
  // q.q || a || b || c || d || correctIndex+1
  const lines = (quiz.questions || []).map((q) => {
    const qText = q.q || "";
    const opts = q.options || [];
    const a = opts[0] ?? "";
    const b = opts[1] ?? "";
    const c = opts[2] ?? "";
    const d = opts[3] ?? "";
    const correctNo = (q.correctIndex ?? 0) + 1;
    return `${qText} || ${a} || ${b} || ${c} || ${d} || ${correctNo}`;
  });

  if (txtQuestions) txtQuestions.value = lines.join("\n");

  status("✅ Quiz loaded: " + quiz.title);
}

function deleteQuiz(quizId) {
  const storage = getStorage();
  if (!storage || !storage.savedQuizzes) return;

  storage.savedQuizzes = storage.savedQuizzes.filter((q) => q.id !== quizId);
  setStorage(storage);
  renderQuizList();
  status("✅ Quiz deleted");
}

/* Connect Save / New buttons */
if (btnSaveQuiz) {
  btnSaveQuiz.addEventListener("click", () => {
    saveFormToLocalStorage(); // keep design synced
    saveQuiz();
  });
}

if (btnNewQuiz) {
  btnNewQuiz.addEventListener("click", () => {
    if (txtQuizTitle) txtQuizTitle.value = "";
    if (txtQuizDescription) txtQuizDescription.value = "";
    if (txtQuestions) txtQuestions.value = "";
    status("Ready for new quiz");
  });
}

/* ==========================================================
   STEP 8: JSON Import / Export of quizzes
========================================================== */

function exportQuizzesToJSON() {
  const storage = getStorage();
  const quizzes = storage?.savedQuizzes || [];

  if (quizzes.length === 0) {
    // Replaced alert with status message
    status("⚠️ No quizzes to export");
    return;
  }

  const jsonString = JSON.stringify(quizzes, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `eagle-quizzes-${Date.now()}.json`;
  a.click();

  status("✅ Quizzes exported!");
}

function importQuizzesFromJSON() {
  if (!inputImportFile) return;
  inputImportFile.value = ""; // reset
  inputImportFile.click();
}

if (inputImportFile) {
  inputImportFile.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          // Replaced alert with status message
          status("❌ Invalid file format. Expected an array of quizzes.");
          return;
        }

        // basic validation
        const valid = parsed.every(
          (q) => q.title && Array.isArray(q.questions)
        );
        if (!valid) {
          // Replaced alert with status message
          status("❌ Invalid quiz data inside file.");
          return;
        }

        const storage = getStorage() || { lastForm: {}, savedQuizzes: [] };

        // Using prompt for replacement logic as window.confirm is restricted
        const replaceInput = prompt(
          "Replace existing quizzes? Type 'OK' to replace or 'MERGE' to merge."
        );
        const replace = replaceInput?.toUpperCase() === 'OK';

        if (replace) {
          storage.savedQuizzes = parsed;
        } else {
          storage.savedQuizzes = (storage.savedQuizzes || []).concat(parsed);
        }

        setStorage(storage);
        renderQuizList();
        status("✅ Quizzes imported successfully!");
      } catch (err) {
        console.error(err);
        status("❌ Failed to read or parse JSON file.");
      }
    };

    reader.readAsText(file);
  });
}

/* Connect Import / Export JSON buttons */
if (btnExportJson) {
  btnExportJson.addEventListener("click", exportQuizzesToJSON);
}
if (btnImportJson) {
  btnImportJson.addEventListener("click", importQuizzesFromJSON);
}

/* ==========================================================
   PREVIEW + EXPORT (using existing engine)
========================================================== */

function buildPlayerDataFromFormAndQuestions() {
  const storage = getStorage();
  if (!storage || !storage.lastForm) return null;

  // First, save current design into lastForm
  saveFormToLocalStorage();
  const data = getStorage();
  if (!data) return null;

  const lastForm = data.lastForm;

  // Parse questions text
  const quizData = parseQuiz(txtQuestions?.value || "");
  if (!quizData.ok) {
    status("❌ Quiz format error. Check questions.");
    return null;
  }

  lastForm.questions = quizData.questions;
  data.lastForm = lastForm;
  setStorage(data);

  status(`Parsed ${quizData.success} questions successfully`);

  return lastForm;
}

function generatePlayerBlob() {
  const PREVIEW_DATA = buildPlayerDataFromFormAndQuestions();
  if (!PREVIEW_DATA) return null;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${PREVIEW_DATA.playerTitle}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="./preview.css">
</head>
<body>
<div id="leoApp"></div>
<script>
  const PLAYER_DATA = ${JSON.stringify(PREVIEW_DATA)};
</script>
<script type="module">
  import { startPlayer } from "./player.js";
  startPlayer(PLAYER_DATA);
</script>
</body>
</html>
`;
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

function generateFinalHTML() {
  const EXPORT_DATA = buildPlayerDataFromFormAndQuestions();
  if (!EXPORT_DATA) return null;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${EXPORT_DATA.playerTitle}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="./preview.css">
</head>
<body>
<div id="leoApp"></div>
<script>
  const PLAYER_DATA = ${JSON.stringify(EXPORT_DATA)};
</script>
<script type="module">
  import { startPlayer } from "./player.js";
  startPlayer(PLAYER_DATA);
</script>
</body>
</html>
`;
  return html;
}

/* Preview buttons (header + quiz tab) */
[btnPreviewHeader, btnPreviewQuiz].forEach((btn) => {
  if (!btn) return;
  btn.addEventListener("click", () => {
    const url = generatePlayerBlob();
    if (url) window.open(url, "_blank");
  });
});

/* Export buttons (header + main export) */
[btnExportHeader, btnExportMain].forEach((btn) => {
  if (!btn) return;
  btn.addEventListener("click", () => {
    const html = generateFinalHTML();
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leo-quiz.html";
    a.click();
    status("Export complete! File downloaded.");
  });
});

/* ==========================================================
   STEP 5: Tab switching
========================================================== */

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active from all buttons
    tabButtons.forEach((b) => b.classList.remove("active"));
    // Remove active from all panels
    tabPanels.forEach((p) => p.classList.remove("active"));

    // Activate clicked button
    button.classList.add("active");
    // Activate corresponding panel
    const selector = button.dataset.tab;
    if (selector) {
      const panel = document.querySelector(selector);
      if (panel) panel.classList.add("active");
    }
  });
});

/* ==========================================================
   Theme toggle (builder)
========================================================== */

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light");
    // Save theme preference to localStorage
    localStorage.setItem("eagle_theme_preference", isLight ? "light" : "dark");
  });
}

/* ==========================================================
   On load
========================================================== */

loadFormFromLocalStorage();
renderQuizList();
status("Ready.");

// Initialize builder theme from localStorage
const savedTheme = localStorage.getItem("eagle_theme_preference");
if (savedTheme === "light") {
  document.body.classList.add("light");
} else {
  document.body.classList.remove("light"); // default dark
}
