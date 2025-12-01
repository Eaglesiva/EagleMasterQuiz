window.QuizCore = (function () {
  function parseQuestions(text) {
    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const questions = [];
    for (const line of lines) {
      const parts = line.split("||").map(p => p.trim());
      if (parts.length < 6) continue;
      const [q, a, b, c, d, correctStr] = parts;
      const correctIndex = parseInt(correctStr, 10) - 1;
      if (!q || isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) continue;

      questions.push({
        text: q,
        options: [a, b, c, d],
        correctIndex
      });
    }
    return questions;
  }

  function validateQuiz(quiz) {
    const errors = [];
    if (!quiz.title || quiz.title.trim().length < 3) {
      errors.push("Title must be at least 3 characters.");
    }
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      errors.push("At least 1 valid question is required.");
    }
    return errors;
  }

  function createQuizObject({ id, title, description, questions }) {
    return {
      id: id ?? Date.now(),
      title: title.trim(),
      description: (description || "").trim(),
      questions,
      createdAt: Date.now()
    };
  }

  return {
    parseQuestions,
    validateQuiz,
    createQuizObject
  };
})();
