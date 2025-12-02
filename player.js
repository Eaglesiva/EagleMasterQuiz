export function startPlayer(PLAYER_DATA) {
  let pd = PLAYER_DATA || {};
  window.PLAYER_DATA = pd;

  // Build Player HTML UI
  const app = document.getElementById("leoApp") || document.body;
  app.innerHTML = `
    <div id="leoPlayer" class="player">
      <div id="question-counter"></div>
      <div id="quiz-container"></div>
      <div id="controls">
        <button id="prev-btn">◀ Prev</button>
        <button id="next-btn">Next ▶</button>
        <button id="submit-btn">Submit</button>
        <button id="restart-btn">Restart</button>
      </div>
    </div>
  `;

  let index = 0;
  window.currentQuestionIndex = 0;

  function render() {
    const q = pd.questions[index];
    const container = document.getElementById("quiz-container");
    container.innerHTML = `
      <div class="question active" data-question-index="${index + 1}">
        <h2>${q.q}</h2>
        ${q.options.map((op, i) => `
          <label><input type="radio" name="q" value="${i}"> ${op}</label>
        `).join("")}
      </div>
    `;
    updateQuestionCounter(index + 1);
  }

  function updateQuestionCounter(num) {
    const el = document.getElementById("question-counter");
    el.textContent = `Question ${num} of ${pd.questions.length}`;
  }

  document.getElementById("next-btn").onclick = () => {
    if (index < pd.questions.length - 1) {
      index++; render();
    }
  };
  document.getElementById("prev-btn").onclick = () => {
    if (index > 0) {
      index--; render();
    }
  };
  document.getElementById("restart-btn").onclick = () => {
    index = 0; render();
  };

  render();

  // AUTO SHEET UPDATE — now safe (only runs if sheetId exists)
  async function autoUpdateFromSheet() {
    try {
      const sid = pd.sheetId;
      if (!sid || sid.trim() === "") return;   // ← FIXED

      if (!navigator.onLine) return;

      const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:json`;
      const res = await fetch(url);
      const text = await res.text();
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

      const rows = json.table.rows.map(r => {
        const d = r.c.map(c => (c && c.v) ? c.v : "");
        return {
          q: d[0],
          options: d[1].split("||"),
          correctIndex: Number(d[2]) - 1
        };
      });

      if (rows.length > pd.questions.length) {
        pd.questions = [...pd.questions, ...rows.slice(pd.questions.length)];
        render();
      }
    } catch {}
  }

  // Call auto update safely
  if (pd.sheetId && pd.sheetId.trim() !== "") {  // ← FIXED WRAPPER
    autoUpdateFromSheet();
  }
}
