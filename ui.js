/* ==========================================================
   EAGLE QUIZ MAKER PRO — UI CONTROLLER (V6.3)
   Handles preview + export + form connections
   Created by 🦅 Eaglesiva
=========================================================== */

import { parseQuiz } from "./core.js";
import { startPlayer } from "./player.js";

/* DOM */
const txtQuestions = document.getElementById("quizQuestions");
const statusBar = document.getElementById("statusBar");

const previewBtns = [
  document.getElementById("previewBtnHeader"),
  document.getElementById("previewBtnQuiz"),
  document.getElementById("previewBtnDesign"),
  document.getElementById("previewBtnExport")
];

const exportBtns = [
  document.getElementById("exportBtnHeader"),
  document.getElementById("exportBtnMain")
];

/* Helper for logs */
function status(msg) {
  statusBar.textContent = msg;
}

/* PREVIEW GENERATOR */
function generatePlayerBlob() {
  const quizData = parseQuiz(txtQuestions.value);
  if (!quizData.ok) {
    alert("❌ Quiz format error. Check questions.");
    status(`Format error. Success: ${quizData.success}, Failed: ${quizData.failed}`);
    return null;
  }

  status(`Parsed ${quizData.success} questions successfully`);

  const PREVIEW_DATA = JSON.parse(localStorage.getItem("eagle_quiz_maker_pro_v63")).lastForm;
  PREVIEW_DATA.questions = quizData.questions;

  /* Open a new tab + inject a temporary HTML */
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

/* EXPORT FINAL HTML */
function generateFinalHTML() {
  const quizData = parseQuiz(txtQuestions.value);
  if (!quizData.ok) {
    alert("❌ Quiz format error. Fix before exporting!");
    return null;
  }

  const EXPORT_DATA = JSON.parse(localStorage.getItem("eagle_quiz_maker_pro_v63")).lastForm;
  EXPORT_DATA.questions = quizData.questions;

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

/* PREVIEW BUTTONS */
previewBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener("click", () => {
      const url = generatePlayerBlob();
      if (url) window.open(url, "_blank");
    });
  }
});

/* EXPORT BUTTONS */
exportBtns.forEach(btn => {
  if (btn) {
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
  }
});
