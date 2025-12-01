(function () {
  const titleEl = document.getElementById("quizTitle");
  const descEl = document.getElementById("quizDescription");
  const questionsEl = document.getElementById("quizQuestions");
  const sheetIdEl = document.getElementById("sheetId");

  const timerEnabledEl = document.getElementById("timerEnabled");
  const timerSecondsEl = document.getElementById("timerSeconds");
  const ttsEnabledEl = document.getElementById("ttsEnabled");
  const soundPackEl = document.getElementById("soundPack");
  const shuffleQuestionsEl = document.getElementById("shuffleQuestions");
  const shuffleOptionsEl = document.getElementById("shuffleOptions");

  const quizListEl = document.getElementById("quizList");
  const statusBar = document.getElementById("statusBar");

  const btnNew = document.getElementById("btnNew");
  const btnSave = document.getElementById("btnSave");
  const btnPreview = document.getElementById("btnPreview");
  const btnExport = document.getElementById("btnExport");
  const btnImport = document.getElementById("btnImport");
  const importFile = document.getElementById("importFile");

  const btnSheetImport = document.getElementById("btnSheetImport");
  const btnExportStandalone = document.getElementById("btnExportStandalone");

  const previewOverlay = document.getElementById("previewOverlay");
  const previewContainer = document.getElementById("previewContainer");
  const btnClosePreview = document.getElementById("btnClosePreview");

  let currentId = null;

  function setStatus(message) {
    if (statusBar) statusBar.textContent = message;
  }

  function clearForm() {
    currentId = null;
    if (titleEl) titleEl.value = "";
    if (descEl) descEl.value = "";
    if (questionsEl) questionsEl.value = "";
    if (sheetIdEl) sheetIdEl.value = "";
    if (timerEnabledEl) timerEnabledEl.checked = true;
    if (timerSecondsEl) timerSecondsEl.value = 20;
    if (ttsEnabledEl) ttsEnabledEl.checked = true;
    if (soundPackEl) soundPackEl.value = "clap-pop";
    if (shuffleQuestionsEl) shuffleQuestionsEl.checked = false;
    if (shuffleOptionsEl) shuffleOptionsEl.checked = false;
    setStatus("Cleared. Ready to create a new quiz.");
  }

  function getSettingsFromForm() {
    const timerEnabled = timerEnabledEl ? timerEnabledEl.checked : true;
    const timerSeconds = timerSecondsEl ? parseInt(timerSecondsEl.value || "20", 10) : 20;
    const ttsEnabled = ttsEnabledEl ? ttsEnabledEl.checked : true;
    const soundPack = soundPackEl ? soundPackEl.value : "clap-pop";
    const shuffleQuestions = shuffleQuestionsEl ? shuffleQuestionsEl.checked : false;
    const shuffleOptions = shuffleOptionsEl ? shuffleOptionsEl.checked : false;

    return {
      timer: {
        enabled: !!timerEnabled,
        seconds: isNaN(timerSeconds) ? 20 : timerSeconds,
        style: "ring" // you chose ring
      },
      tts: {
        enabled: !!ttsEnabled,
        read: "question" // question only
      },
      sound: soundPack, // "clap-pop" or "none"
      shuffleQuestions,
      shuffleOptions,
      theme: "dark"
    };
  }

  function loadQuizzesList() {
    const quizzes = window.QuizStorage.loadAll();
    quizListEl.innerHTML = "";
    if (!quizzes.length) {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "help-text";
      emptyMsg.textContent = "No quizzes saved yet.";
      quizListEl.appendChild(emptyMsg);
      return;
    }
    quizzes.forEach(quiz => {
      const card = document.createElement("div");
      card.className = "quiz-card";

      const header = document.createElement("div");
      header.className = "quiz-card-header";

      const title = document.createElement("div");
      title.className = "quiz-card-title";
      title.textContent = quiz.title;

      const meta = document.createElement("div");
      meta.className = "quiz-card-meta";
      const date = new Date(quiz.createdAt || Date.now());
      const sheetInfo = quiz.sheetId ? " · Sheet ID set" : "";
      meta.textContent = `${quiz.questions.length} Q · ${date.toLocaleString()}${sheetInfo}`;

      header.appendChild(title);
      header.appendChild(meta);
      card.appendChild(header);

      const actions = document.createElement("div");
      actions.className = "quiz-card-actions";

      const btnLoad = document.createElement("button");
      btnLoad.className = "ghost-btn small";
      btnLoad.textContent = "✏ Edit";
      btnLoad.addEventListener("click", () => fillFormFromQuiz(quiz));

      const btnPrev = document.createElement("button");
      btnPrev.className = "secondary-btn small";
      btnPrev.textContent = "👁 Preview";
      btnPrev.addEventListener("click", () => openPreview(quiz));

      const btnPlay = document.createElement("button");
      btnPlay.className = "ghost-btn small";
      btnPlay.textContent = "▶ Play (new tab)";
      btnPlay.addEventListener("click", () => {
        const url = `standalone.html?id=${quiz.id}`;
        window.open(url, "_blank");
      });

      const btnExportSingle = document.createElement("button");
      btnExportSingle.className = "secondary-btn small";
      btnExportSingle.textContent = "⬇ Export HTML";
      btnExportSingle.addEventListener("click", () => {
        exportQuizAsSingleHtml(quiz);
      });

      const btnDel = document.createElement("button");
      btnDel.className = "ghost-btn small";
      btnDel.textContent = "🗑 Delete";
      btnDel.addEventListener("click", () => {
        if (confirm("Delete this quiz permanently?")) {
          window.QuizStorage.remove(quiz.id);
          loadQuizzesList();
          setStatus("Quiz deleted.");
        }
      });

      actions.appendChild(btnLoad);
      actions.appendChild(btnPrev);
      actions.appendChild(btnPlay);
      actions.appendChild(btnExportSingle);
      actions.appendChild(btnDel);
      card.appendChild(actions);

      quizListEl.appendChild(card);
    });
  }

  function fillFormFromQuiz(quiz) {
    currentId = quiz.id;
    if (titleEl) titleEl.value = quiz.title;
    if (descEl) descEl.value = quiz.description || "";
    if (sheetIdEl) sheetIdEl.value = quiz.sheetId || "";

    if (questionsEl) {
      const lines = quiz.questions.map(
        q =>
          `${q.text} || ${q.options[0]} || ${q.options[1]} || ${q.options[2]} || ${q.options[3]} || ${
            q.correctIndex + 1
          }`
      );
      questionsEl.value = lines.join("\n");
    }

    const settings = quiz.settings || {};
    if (timerEnabledEl) timerEnabledEl.checked = settings.timer ? !!settings.timer.enabled : true;
    if (timerSecondsEl) timerSecondsEl.value = settings.timer ? settings.timer.seconds || 20 : 20;
    if (ttsEnabledEl) ttsEnabledEl.checked = settings.tts ? !!settings.tts.enabled : true;
    if (soundPackEl) soundPackEl.value = settings.sound || "clap-pop";
    if (shuffleQuestionsEl) shuffleQuestionsEl.checked = !!settings.shuffleQuestions;
    if (shuffleOptionsEl) shuffleOptionsEl.checked = !!settings.shuffleOptions;

    setStatus("Loaded quiz for editing.");
  }

  function buildQuizFromForm() {
    const title = titleEl.value;
    const description = descEl.value;
    const questionText = questionsEl.value;
    const sheetId = sheetIdEl.value.trim();

    const questions = window.QuizCore.parseQuestions(questionText);
    const tempQuiz = window.QuizCore.createQuizObject({
      id: currentId ?? undefined,
      title,
      description,
      questions
    });

    if (sheetId) {
      tempQuiz.sheetId = sheetId;
    }

    tempQuiz.settings = getSettingsFromForm();

    const errors = window.QuizCore.validateQuiz(tempQuiz);
    if (errors.length) {
      alert("Please fix:\n\n" + errors.join("\n"));
      return null;
    }
    return tempQuiz;
  }

  function openPreview(quiz) {
    previewContainer.innerHTML = "";
    window.QuizPlayer.renderQuiz(previewContainer, quiz);
    previewOverlay.classList.remove("hidden");
  }

  function csvToQuestionLines(csv) {
    const lines = csv.split(/\r?\n/).slice(1);
    const out = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split(",");
      if (cols.length < 6) continue;
      const [qRaw, aRaw, bRaw, cRaw, dRaw, ansRaw] = cols;
      const q = (qRaw || "").trim();
      const a = (aRaw || "").trim();
      const b = (bRaw || "").trim();
      const c = (cRaw || "").trim();
      const d = (dRaw || "").trim();
      const ansLetter = (ansRaw || "").trim().toUpperCase();
      if (!q || !a || !b || !c || !d || !ansLetter) continue;
      let correctNum = 1;
      if (ansLetter === "A") correctNum = 1;
      else if (ansLetter === "B") correctNum = 2;
      else if (ansLetter === "C") correctNum = 3;
      else if (ansLetter === "D") correctNum = 4;
      out.push(`${q} || ${a} || ${b} || ${c} || ${d} || ${correctNum}`);
    }
    return out;
  }

  function exportQuizAsSingleHtml(quiz) {
    const exportData = {
      title: quiz.title,
      description: quiz.description || "",
      questions: quiz.questions,
      sheetId: quiz.sheetId || "",
      settings: quiz.settings || {
        timer: { enabled: true, seconds: 20, style: "ring" },
        tts: { enabled: true, read: "question" },
        sound: "clap-pop",
        shuffleQuestions: false,
        shuffleOptions: false,
        theme: "dark"
      }
    };

    const quizJson = JSON.stringify(exportData);

    const html =
`<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <title>${exportData.title || "EAGLE Quiz"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Standalone quiz generated from Google Sheet.">
  <style>
    body{
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif;
      background:#020617;
      color:#e5e7eb;
      margin:0;
      padding:16px;
      display:flex;
      justify-content:center;
      align-items:flex-start;
      min-height:100vh;
    }
    .shell{
      width:100%;
      max-width:640px;
      background:#020617;
      border-radius:20px;
      border:1px solid rgba(148,163,184,.5);
      box-shadow:0 20px 40px rgba(15,23,42,.9);
      padding:16px;
    }
    h1{font-size:1.1rem;margin:0 0 4px;}
    .desc{font-size:.8rem;color:#9ca3af;margin-bottom:10px;}
    .top-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
    .timer-wrapper{
      display:flex;
      align-items:center;
      gap:8px;
      font-size:.75rem;
      color:#9ca3af;
    }
    .timer-ring{
      width:34px;height:34px;
    }
    .timer-ring circle{
      fill:none;
      stroke:#4b5563;
      stroke-width:4;
    }
    .timer-ring circle.progress{
      stroke:#22c55e;
      stroke-linecap:round;
      transform:rotate(-90deg);
      transform-origin:50% 50%;
      transition:stroke-dashoffset 0.15s linear, stroke 0.15s linear;
    }
    .q-wrap h2{font-size:.95rem;margin-bottom:6px;}
    .options{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;}
    .opt-btn{
      width:100%;
      text-align:left;
      padding:7px 9px;
      border-radius:12px;
      border:1px solid rgba(55,65,81,.9);
      background:#020617;
      color:#e5e7eb;
      font-size:.8rem;
      cursor:pointer;
    }
    .opt-btn:hover{border-color:#818cf8;}
    .opt-btn.correct{border-color:#22c55e;background:rgba(22,163,74,.12);}
    .opt-btn.wrong{border-color:#f97373;background:rgba(248,113,113,.12);}
    .progress{font-size:.75rem;color:#9ca3af;margin-top:6px;}
    .result{font-size:.85rem;margin:8px 0 4px;}
    .row{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;}
    .btn{border:none;border-radius:999px;padding:6px 12px;font-size:.8rem;font-weight:600;cursor:pointer;}
    .btn-primary{background:linear-gradient(135deg,#4f46e5,#ec4899);color:#fff;}
    .btn-ghost{background:#020617;color:#cbd5f5;border:1px solid rgba(75,85,99,.9);}
    .status{font-size:.75rem;color:#9ca3af;margin-top:6px;}
    .score-big{font-size:1.2rem;margin-bottom:4px;}
  </style>
</head>
<body>
<div class="shell">
  <div class="top-row">
    <div>
      <h1>${exportData.title || "EAGLE Quiz"}</h1>
      <div class="desc">${exportData.description || "Interactive quiz"}</div>
    </div>
    <div class="timer-wrapper" id="timerBox" style="display:none;">
      <svg class="timer-ring" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15"></circle>
        <circle class="progress" cx="18" cy="18" r="15" stroke-dasharray="94" stroke-dashoffset="0"></circle>
      </svg>
      <span id="timerLabel">00</span>
    </div>
  </div>
  <div id="quizRoot"></div>
  <div class="status" id="statusLine"></div>
</div>
<script>
  const EXPORT_QUIZ = ${quizJson};
  const STORAGE_KEY = "EAGLE_STANDALONE_" + (EXPORT_QUIZ.sheetId || "LOCAL");

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function parseCsvToQuestions(csv){
    const lines = csv.split(/\\r?\\n/).slice(1);
    const qs = [];
    for(const line of lines){
      if(!line.trim()) continue;
      const cols = line.split(",");
      if(cols.length < 6) continue;
      const [qRaw,aRaw,bRaw,cRaw,dRaw,ansRaw] = cols;
      const q = (qRaw||"").trim();
      const a = (aRaw||"").trim();
      const b = (bRaw||"").trim();
      const c = (cRaw||"").trim();
      const d = (dRaw||"").trim();
      const ansLetter = (ansRaw||"").trim().toUpperCase();
      if(!q||!a||!b||!c||!d||!ansLetter) continue;
      let idx = 0;
      if(ansLetter==="A") idx = 0;
      else if(ansLetter==="B") idx = 1;
      else if(ansLetter==="C") idx = 2;
      else if(ansLetter==="D") idx = 3;
      qs.push({text:q, options:[a,b,c,d], correctIndex:idx});
    }
    return qs;
  }

  function loadStoredQuestions(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const data = JSON.parse(raw);
      if(!Array.isArray(data)) return null;
      return data;
    }catch(e){
      return null;
    }
  }

  function saveStoredQuestions(qs){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(qs));
    }catch(e){}
  }

  let audioCtx = null;
  function getAudioCtx(){
    if(!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(AC) audioCtx = new AC();
    }
    return audioCtx;
  }
  function playBeep(freq, dur){
    const ctx = getAudioCtx();
    if(!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }
  function playCorrectSound(){
    if(EXPORT_QUIZ.settings.sound === "clap-pop"){
      playBeep(880,0.12);
      setTimeout(()=>playBeep(1320,0.1),90);
    }
  }
  function playWrongSound(){
    if(EXPORT_QUIZ.settings.sound === "clap-pop"){
      playBeep(220,0.18);
    }
  }

  function getTamilVoice(){
    const voices = speechSynthesis.getVoices();
    const tamil = voices.filter(v => (v.lang||"").toLowerCase().startsWith("ta"));
    if(tamil.length){
      const female = tamil.find(v => /female|woman|lady/i.test(v.name));
      return female || tamil[0];
    }
    return null;
  }
  let cachedTamilVoice = null;
  function speakQuestion(text){
    if(!EXPORT_QUIZ.settings.tts || !EXPORT_QUIZ.settings.tts.enabled) return;
    if(!("speechSynthesis" in window)) return;
    const utt = new SpeechSynthesisUtterance(text);
    if(!cachedTamilVoice){
      cachedTamilVoice = getTamilVoice();
      if(!cachedTamilVoice){
        const all = speechSynthesis.getVoices();
        cachedTamilVoice = all.find(v => v.lang && v.lang.toLowerCase().startsWith("ta")) || all[0];
      }
    }
    if(cachedTamilVoice) utt.voice = cachedTamilVoice;
    utt.rate = 0.95;
    utt.pitch = 1.0;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  }

  function renderQuiz(root, questions){
    root.innerHTML = "";
    let qList = questions.slice();
    if(EXPORT_QUIZ.settings.shuffleQuestions) qList = shuffle(qList);

    let index = 0;
    let score = 0;

    const qWrap = document.createElement("div");
    qWrap.className = "q-wrap";
    const progressEl = document.createElement("div");
    progressEl.className = "progress";
    const resultEl = document.createElement("div");
    resultEl.className = "result";
    const row = document.createElement("div");
    row.className = "row";
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.textContent = "Next ▶";
    const restartBtn = document.createElement("button");
    restartBtn.className = "btn btn-ghost";
    restartBtn.textContent = "Restart";
    restartBtn.style.display = "none";
    const shareBtn = document.createElement("button");
    shareBtn.className = "btn btn-ghost";
    shareBtn.textContent = "Share Score";

    row.appendChild(nextBtn);
    row.appendChild(restartBtn);
    row.appendChild(shareBtn);

    root.appendChild(qWrap);
    root.appendChild(progressEl);
    root.appendChild(resultEl);
    root.appendChild(row);

    const timerBox = document.getElementById("timerBox");
    const timerLabel = document.getElementById("timerLabel");
    const ring = document.querySelector(".timer-ring circle.progress");
    const fullDash = 94;

    let locked = false;
    let timerId = null;
    let timeLeft = EXPORT_QUIZ.settings.timer.seconds || 20;

    function resetTimerVisual(){
      if(!EXPORT_QUIZ.settings.timer.enabled) return;
      if(!timerBox || !timerLabel || !ring) return;
      timerBox.style.display = "flex";
      const total = EXPORT_QUIZ.settings.timer.seconds || 20;
      timeLeft = total;
      timerLabel.textContent = String(total);
      ring.style.strokeDasharray = fullDash;
      ring.style.strokeDashoffset = 0;
      ring.style.stroke = "#22c55e";
    }

    function startTimer(onTimeout){
      if(!EXPORT_QUIZ.settings.timer.enabled) return;
      if(timerId) clearInterval(timerId);
      resetTimerVisual();
      const total = EXPORT_QUIZ.settings.timer.seconds || 20;

      timerId = setInterval(()=>{
        timeLeft--;
        if(timeLeft < 0){
          clearInterval(timerId);
          timerId = null;
          if(ring) ring.style.stroke = "#f97373";
          onTimeout();
        }else{
          if(timerLabel) timerLabel.textContent = String(timeLeft);
          const fraction = (total - timeLeft) / total;
          if(ring){
            ring.style.strokeDashoffset = fraction * fullDash;
            ring.style.stroke = timeLeft <= 5 ? "#f97373" : "#22c55e";
          }
        }
      },1000);
    }

    function stopTimer(){
      if(timerId){
        clearInterval(timerId);
        timerId = null;
      }
    }

    function showQuestion(){
      locked = false;
      resultEl.textContent = "";
      const q = qList[index];
      qWrap.innerHTML = "";

      const title = document.createElement("h2");
      title.textContent = "Q" + (index+1) + ". " + q.text;
      qWrap.appendChild(title);

      if(EXPORT_QUIZ.settings.tts && EXPORT_QUIZ.settings.tts.enabled){
        const loadVoices = () => speakQuestion(q.text);
        if(speechSynthesis.getVoices().length === 0){
          speechSynthesis.onvoiceschanged = loadVoices;
        } else {
          loadVoices();
        }
      }

      const list = document.createElement("ul");
      list.className = "options";
      qWrap.appendChild(list);

      let optionOrder = q.options.map((opt,i)=>({opt,i}));
      if(EXPORT_QUIZ.settings.shuffleOptions) optionOrder = shuffle(optionOrder);

      optionOrder.forEach(({opt,i})=>{
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "opt-btn";
        btn.textContent = opt;
        btn.addEventListener("click", ()=>{
          if(locked) return;
          locked = true;
          stopTimer();
          if(i === q.correctIndex){
            score++;
            btn.classList.add("correct");
            resultEl.textContent = "✅ Correct!";
            playCorrectSound();
          }else{
            btn.classList.add("wrong");
            resultEl.textContent = "❌ Wrong!";
            playWrongSound();
          }
          Array.from(list.querySelectorAll(".opt-btn")).forEach((b,idx)=>{
            const original = optionOrder[idx].i;
            if(original === q.correctIndex) b.classList.add("correct");
          });
        });
        li.appendChild(btn);
        list.appendChild(li);
      });

      progressEl.textContent = "Question " + (index+1) + " of " + qList.length;

      if(EXPORT_QUIZ.settings.timer.enabled){
        startTimer(()=>{
          if(!locked){
            locked = true;
            resultEl.textContent = "⏰ Time up!";
            playWrongSound();
            Array.from(list.querySelectorAll(".opt-btn")).forEach((b,idx)=>{
              const original = optionOrder[idx].i;
              if(original === q.correctIndex) b.classList.add("correct");
            });
          }
        });
      } else {
        if(timerBox) timerBox.style.display = "none";
      }
    }

    function finishQuiz(){
      stopTimer();
      qWrap.innerHTML = "";
      const percent = Math.round((score / qList.length) * 100);
      const msg = percent >= 80 ? "🔥 Awesome!" :
                  percent >= 50 ? "👌 Good try!" : "📚 Keep practicing!";
      resultEl.innerHTML = "<div class='score-big'>Score: " + score + " / " + qList.length +
        " (" + percent + "%)</div>" + msg + " 🎉🎉";
      progressEl.textContent = "Quiz finished.";
      nextBtn.style.display = "none";
      restartBtn.style.display = "inline-flex";
    }

    nextBtn.addEventListener("click", ()=>{
      if(index < qList.length - 1){
        index++;
        stopTimer();
        showQuestion();
      }else{
        finishQuiz();
      }
    });

    restartBtn.addEventListener("click", ()=>{
      index = 0;
      score = 0;
      nextBtn.style.display = "inline-flex";
      restartBtn.style.display = "none";
      stopTimer();
      showQuestion();
    });

    shareBtn.addEventListener("click", ()=>{
      const percent = Math.round((score / qList.length) * 100);
      const text = "I scored " + score + "/" + qList.length + " (" + percent +
        "%) in the quiz: " + (EXPORT_QUIZ.title || "EAGLE Quiz");
      const url = location.href;
      if(navigator.share){
        navigator.share({ title: EXPORT_QUIZ.title || "Quiz", text, url }).catch(()=>{});
      }else if(navigator.clipboard){
        navigator.clipboard.writeText(text + "\\n" + url);
        alert("Score + link copied. You can paste it in WhatsApp / Instagram / YouTube!");
      }else{
        alert(text + "\\n" + url);
      }
    });

    showQuestion();
  }

  async function syncFromSheetIfPossible(currentQuestions){
    const status = document.getElementById("statusLine");
    if(!EXPORT_QUIZ.sheetId){
      status.textContent = "Offline quiz (no sheet linked).";
      return;
    }
    const url = "https://docs.google.com/spreadsheets/d/" + EXPORT_QUIZ.sheetId + "/export?format=csv";
    try{
      status.textContent = "Checking for updates from sheet...";
      const res = await fetch(url);
      if(!res.ok) throw new Error("HTTP " + res.status);
      const csv = await res.text();
      const newQs = parseCsvToQuestions(csv);
      if(!newQs.length){
        status.textContent = "Using stored questions (sheet gave no rows).";
        return;
      }
      const oldJson = JSON.stringify(currentQuestions);
      const newJson = JSON.stringify(newQs);
      if(oldJson !== newJson){
        saveStoredQuestions(newQs);
        status.textContent = "Quiz updated from sheet.";
        if(confirm("Quiz updated with new questions. Reload?")){
          location.reload();
        }
      }else{
        status.textContent = "Already up to date with sheet.";
      }
    }catch(e){
      status.textContent = "Offline or unable to reach sheet. Using stored questions.";
    }
  }

  (function initStandalone(){
    let questions = loadStoredQuestions();
    if(!questions || !questions.length){
      questions = EXPORT_QUIZ.questions || [];
      saveStoredQuestions(questions);
    }
    const root = document.getElementById("quizRoot");
    renderQuiz(root, questions);
    syncFromSheetIfPossible(questions);
  })();
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = (exportData.title || "eagle-quiz").replace(/[^a-z0-9\-]+/gi, "-").toLowerCase();
    a.download = safeTitle + ".html";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported standalone HTML quiz file (pro version).");
  }

  // Event listeners
  if (btnNew) {
    btnNew.addEventListener("click", clearForm);
  }

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const quiz = buildQuizFromForm();
      if (!quiz) return;
      window.QuizStorage.upsert(quiz);
      currentId = quiz.id;
      loadQuizzesList();
      setStatus("Quiz saved successfully.");
    });
  }

  if (btnPreview) {
    btnPreview.addEventListener("click", () => {
      const quiz = buildQuizFromForm();
      if (!quiz) return;
      openPreview(quiz);
    });
  }

  if (btnExportStandalone) {
    btnExportStandalone.addEventListener("click", () => {
      const quiz = buildQuizFromForm();
      if (!quiz) return;
      exportQuizAsSingleHtml(quiz);
    });
  }

  if (btnClosePreview) {
    btnClosePreview.addEventListener("click", () => {
      previewOverlay.classList.add("hidden");
    });
  }

  if (previewOverlay) {
    previewOverlay.addEventListener("click", e => {
      if (e.target === previewOverlay) {
        previewOverlay.classList.add("hidden");
      }
    });
  }

  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const quizzes = window.QuizStorage.loadAll();
      if (!quizzes.length) {
        alert("No quizzes to export.");
        return;
      }
      const blob = new Blob([JSON.stringify(quizzes, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "eagle-quizzes.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Exported quizzes as JSON file.");
    });
  }

  if (btnImport) {
    btnImport.addEventListener("click", () => {
      importFile.click();
    });
  }

  if (importFile) {
    importFile.addEventListener("change", () => {
      const file = importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data)) {
            alert("Invalid file format.");
            return;
          }
          window.QuizStorage.saveAll(data);
          loadQuizzesList();
          setStatus("Imported quizzes successfully.");
        } catch (e) {
          console.error(e);
          alert("Failed to import JSON.");
        }
      };
      reader.readAsText(file);
    });
  }

  if (btnSheetImport) {
    btnSheetImport.addEventListener("click", async () => {
      const sheetId = sheetIdEl.value.trim();
      if (!sheetId) {
        alert("Paste Google Sheet ID first.");
        return;
      }
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      try {
        setStatus("Loading from Google Sheet...");
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const csv = await res.text();
        const lines = csvToQuestionLines(csv);
        if (!lines.length) {
          alert("No valid questions found. Check sheet format (Question, A, B, C, D, Answer).");
          setStatus("No questions imported.");
          return;
        }
        questionsEl.value = lines.join("\n");
        setStatus(`Imported ${lines.length} questions from sheet.`);
      } catch (e) {
        console.error(e);
        alert("Unable to load from sheet. Make sure the sheet is published and ID is correct.");
        setStatus("Failed to import from sheet.");
      }
    });
  }

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light");
    });
  }

  loadQuizzesList();
  setStatus("Ready. Create or import your quiz!");
})();
