(function () {
  const titleEl = document.getElementById("quizTitle");
  const descEl = document.getElementById("quizDescription");
  const questionsEl = document.getElementById("quizQuestions");
  const quizListEl = document.getElementById("quizList");
  const statusBar = document.getElementById("statusBar");

  const btnNew = document.getElementById("btnNew");
  const btnSave = document.getElementById("btnSave");
  const btnPreview = document.getElementById("btnPreview");
  const btnExport = document.getElementById("btnExport");
  const btnImport = document.getElementById("btnImport");
  const importFile = document.getElementById("importFile");

  const previewOverlay = document.getElementById("previewOverlay");
  const previewContainer = document.getElementById("previewContainer");
  const btnClosePreview = document.getElementById("btnClosePreview");

  let currentId = null;

  function setStatus(message) {
    statusBar.textContent = message;
  }

  function clearForm() {
    currentId = null;
    titleEl.value = "";
    descEl.value = "";
    questionsEl.value = "";
    setStatus("Cleared. Ready to create a new quiz.");
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
      meta.textContent = `${quiz.questions.length} Q · ${date.toLocaleString()}`;

      header.appendChild(title);
      header.appendChild(meta);
      card.appendChild(header);

      const actions = document.createElement("div");
      actions.className = "quiz-card-actions";

      const btnLoad = document.createElement("button");
      btnLoad.className = "ghost-btn small";
      btnLoad.textContent = "? Edit";
      btnLoad.addEventListener("click", () => fillFormFromQuiz(quiz));

      const btnPrev = document.createElement("button");
      btnPrev.className = "secondary-btn small";
      btnPrev.textContent = "?? Preview";
      btnPrev.addEventListener("click", () => openPreview(quiz));

      const btnPlay = document.createElement("button");
      btnPlay.className = "ghost-btn small";
      btnPlay.textContent = "? Play (new tab)";
      btnPlay.addEventListener("click", () => {
        const url = `standalone.html?id=${quiz.id}`;
        window.open(url, "_blank");
      });

      const btnDel = document.createElement("button");
      btnDel.className = "ghost-btn small";
      btnDel.textContent = "?? Delete";
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
      actions.appendChild(btnDel);
      card.appendChild(actions);

      quizListEl.appendChild(card);
    });
  }

  function fillFormFromQuiz(quiz) {
    currentId = quiz.id;
    titleEl.value = quiz.title;
    descEl.value = quiz.description || "";
    const lines = quiz.questions
      .map(q => `${q.text} || ${q.options[0]} || ${q.options[1]} || ${q.options[2]} || ${q.options[3]} || ${q.correctIndex + 1}`);
    questionsEl.value = lines.join("\n");
    setStatus("Loaded quiz for editing.");
  }

  function buildQuizFromForm() {
    const title = titleEl.value;
    const description = descEl.value;
    const questionText = questionsEl.value;

    const questions = window.QuizCore.parseQuestions(questionText);
    const tempQuiz = window.QuizCore.createQuizObject({
      id: currentId ?? undefined,
      title,
      description,
      questions
    });

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

  // Event listeners
  btnNew.addEventListener("click", clearForm);

  btnSave.addEventListener("click", () => {
    const quiz = buildQuizFromForm();
    if (!quiz) return;
    window.QuizStorage.upsert(quiz);
    currentId = quiz.id;
    loadQuizzesList();
    setStatus("Quiz saved successfully.");
  });

  btnPreview.addEventListener("click", () => {
    const quiz = buildQuizFromForm();
    if (!quiz) return;
    openPreview(quiz);
  });

  btnClosePreview.addEventListener("click", () => {
    previewOverlay.classList.add("hidden");
  });

  previewOverlay.addEventListener("click", e => {
    if (e.target === previewOverlay) {
      previewOverlay.classList.add("hidden");
    }
  });

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

  btnImport.addEventListener("click", () => {
    importFile.click();
  });

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

  // Light/dark theme toggle (basic)
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });

  // Init
  loadQuizzesList();
  setStatus("Ready. Create your first quiz!");
})();
