window.QuizStorage = (function () {
  const KEY = "EAGLE_MASTER_QUIZZES_V1";

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error("Failed to load quizzes", e);
      return [];
    }
  }

  function saveAll(quizzes) {
    try {
      localStorage.setItem(KEY, JSON.stringify(quizzes));
      return true;
    } catch (e) {
      console.error("Failed to save quizzes", e);
      return false;
    }
  }

  function upsert(quiz) {
    const all = loadAll();
    const idx = all.findIndex(q => String(q.id) === String(quiz.id));
    if (idx >= 0) {
      all[idx] = quiz;
    } else {
      all.unshift(quiz);
    }
    saveAll(all);
    return quiz;
  }

  function remove(id) {
    const all = loadAll();
    const filtered = all.filter(q => String(q.id) !== String(id));
    saveAll(filtered);
    return filtered;
  }

  return {
    loadAll,
    saveAll,
    upsert,
    remove
  };
})();
