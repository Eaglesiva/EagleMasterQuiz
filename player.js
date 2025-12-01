window.QuizPlayer = (function () {
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderQuiz(container, quiz) {
    container.innerHTML = "";

    const titleEl = document.createElement("div");
    titleEl.className = "quiz-player-title";
    titleEl.textContent = quiz.title;
    container.appendChild(titleEl);

    if (quiz.description) {
      const descEl = document.createElement("div");
      descEl.className = "quiz-player-desc";
      descEl.textContent = quiz.description;
      container.appendChild(descEl);
    }

    let index = 0;
    let score = 0;
    const questions = shuffle(quiz.questions);

    const questionWrapper = document.createElement("div");
    questionWrapper.className = "quiz-player-question";
    container.appendChild(questionWrapper);

    const progressEl = document.createElement("div");
    progressEl.className = "quiz-progress";
    container.appendChild(progressEl);

    const nextRow = document.createElement("div");
    nextRow.className = "button-row";
    container.appendChild(nextRow);

    const nextBtn = document.createElement("button");
    nextBtn.className = "secondary-btn small";
    nextBtn.textContent = "Next ?";
    nextRow.appendChild(nextBtn);

    const restartBtn = document.createElement("button");
    restartBtn.className = "ghost-btn small";
    restartBtn.textContent = "Restart";
    restartBtn.style.display = "none";
    nextRow.appendChild(restartBtn);

    const resultEl = document.createElement("div");
    resultEl.className = "quiz-result";
    container.appendChild(resultEl);

    let locked = false;

    function showQuestion() {
      locked = false;
      resultEl.textContent = "";
      const q = questions[index];
      questionWrapper.innerHTML = "";

      const qTitle = document.createElement("h3");
      qTitle.textContent = `Q${index + 1}. ${q.text}`;
      questionWrapper.appendChild(qTitle);

      const list = document.createElement("ul");
      list.className = "options-list";
      questionWrapper.appendChild(list);

      q.options.forEach((opt, i) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (locked) return;
          locked = true;
          if (i === q.correctIndex) {
            score++;
            btn.classList.add("correct");
            resultEl.textContent = "? Correct!";
          } else {
            btn.classList.add("wrong");
            resultEl.textContent = "? Wrong!";
          }
          // show correct one
          Array.from(list.querySelectorAll(".option-btn")).forEach((b, idx) => {
            if (idx === q.correctIndex) b.classList.add("correct");
          });
        });
        li.appendChild(btn);
        list.appendChild(li);
      });

      progressEl.textContent = `Question ${index + 1} of ${questions.length}`;
    }

    function finishQuiz() {
      questionWrapper.innerHTML = "";
      resultEl.textContent = `?? You scored ${score} / ${questions.length}`;
      progressEl.textContent = "Quiz finished.";
      nextBtn.style.display = "none";
      restartBtn.style.display = "inline-flex";
    }

    nextBtn.addEventListener("click", () => {
      if (index < questions.length - 1) {
        index++;
        showQuestion();
      } else {
        finishQuiz();
      }
    });

    restartBtn.addEventListener("click", () => {
      index = 0;
      score = 0;
      nextBtn.style.display = "inline-flex";
      restartBtn.style.display = "none";
      showQuestion();
    });

    showQuestion();
  }

  return {
    renderQuiz
  };
})();
