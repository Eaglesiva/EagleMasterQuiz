/* ==========================================================
   EAGLE QUIZ MAKER PRO — CORE ENGINE (V6.3)
   Parses quiz text > JSON, validates > returns result object
   Created by 🦅 Eaglesiva
=========================================================== */

export function parseQuiz(text) {
  if (!text) return { ok: false, error: "Empty quiz input", questions: [] };

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const questions = [];
  let total = 0, success = 0, failed = 0;

  lines.forEach((row, index) => {
    total++;
    const parts = row.split("||").map(p => p.trim());
    if (parts.length !== 6) {
      failed++;
      return;
    }

    const [q, a, b, c, d, correct] = parts;
    const correctIndex = Number(correct) - 1;

    if (!q || [a,b,c,d].some(x => !x) || correctIndex < 0 || correctIndex > 3) {
      failed++;
      return;
    }

    questions.push({
      q,
      options: [a, b, c, d],
      correctIndex
    });
    success++;
  });

  return {
    ok: questions.length > 0,
    total,
    success,
    failed,
    questions
  };
}
