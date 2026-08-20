// ═══════════════════════════════════════════════════════════
// quizEngine.js v5 — Trắc nghiệm ở chế độ TOÀN TRANG
//  · Sinh câu hỏi mới, không trùng lịch sử
//  · Thanh tiến độ dính, nộp bài ở thanh dưới cố định
// ═══════════════════════════════════════════════════════════

const QuizEngine = (() => {
  const HIST_KEY = 'aicb_quiz_mcq_hist_v4';
  const LETTERS  = ['A', 'B', 'C', 'D', 'E', 'F'];

  const $ = id => document.getElementById(id);

  // ─── History ─────────────────────────────────────────────
  const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch { return {}; } };
  const saveHistory = h => localStorage.setItem(HIST_KEY, JSON.stringify(h));
  const getHistory  = id => loadHistory()[id] || [];

  function addToHistory(lessonId, questions) {
    const h = loadHistory();
    if (!h[lessonId]) h[lessonId] = [];
    h[lessonId].unshift({ questions, result: null, timestamp: Date.now() });
    if (h[lessonId].length > 10) h[lessonId] = h[lessonId].slice(0, 10);
    saveHistory(h);
    return h[lessonId];
  }

  // ─── State ───────────────────────────────────────────────
  let currentLesson = null;
  let questions = [];
  let answers = {};
  let submitted = false;
  let histIndex = 0;

  // ─── Prompt ──────────────────────────────────────────────
  function buildPrompt(lesson) {
    const past = getHistory(lesson.id).flatMap(h => h.questions.map(q => q.question)).slice(0, 20);
    const exclude = past.length
      ? `\nCÁC CÂU HỎI ĐÃ RA TRƯỚC ĐÓ (KHÔNG ĐƯỢC LẶP LẠI NỘI DUNG):\n${past.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
      : '';

    return `Tạo 10 câu hỏi trắc nghiệm khách quan (MCQ) cho bài "${lesson.title}" (${lesson.topics.join(', ')}).
BẮT BUỘC ĐỦ 10 CÂU HỎI MỚI.${exclude}

Trả về JSON (CHỈ JSON, không kèm text khác):
{
  "questions": [
    {
      "question": "Câu hỏi rõ ràng?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": 0,
      "explanation": "Giải thích đáp án đúng và vì sao các đáp án khác sai."
    }
  ]
}

Yêu cầu:
- Tối thiểu 10 câu, khác hoàn toàn các câu đã ra.
- Độ khó tăng dần, bao quát nhiều khái niệm của bài học.
- "answer" là chỉ số 0-3 tương ứng với "options".
- Không dùng emoji trong nội dung.`;
  }

  // ─── Generate ────────────────────────────────────────────
  async function generate(lesson) {
    const btn = $('gen-quiz-btn'), thinking = $('quiz-thinking');
    btn && (btn.disabled = true);
    thinking?.classList.remove('off');
    histIndex = 0;

    try {
      const text = await AIEngine.callAI(
        buildPrompt(lesson),
        'Bạn là giảng viên AICB soạn đề trắc nghiệm. Chỉ trả về JSON đúng định dạng.'
      );
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('AI không trả về JSON hợp lệ');
      const data = JSON.parse(m[0]);
      if (!data.questions?.length) throw new Error('Dữ liệu quiz trống');

      addToHistory(lesson.id, data.questions);
      setQuiz(data.questions, null);
      refreshPanel();
      openFullPage();
      App.toast('Đã tạo bài trắc nghiệm mới', 'success');
    } catch (e) {
      App.toast(errMsg(e), 'error');
    } finally {
      btn && (btn.disabled = false);
      thinking?.classList.add('off');
    }
  }

  function errMsg(e) {
    return e.message === 'no_api_key' ? 'Hãy nhập API Key trong phần Cài đặt' : 'Lỗi tạo quiz: ' + e.message;
  }

  function setQuiz(qs, result) {
    questions = qs || [];
    answers   = result?.answers ? { ...result.answers } : {};
    submitted = !!result;
  }

  // ─── Full-page rendering ─────────────────────────────────
  function buildBody() {
    let scorePanel = '';
    if (submitted) {
      const correct = countCorrect();
      const pct = Math.round(correct / questions.length * 100);
      const tone = pct >= 80 ? 'good' : pct >= 50 ? '' : 'bad';
      const verdict = pct >= 80 ? 'Kết quả xuất sắc' : pct >= 50 ? 'Kết quả khá' : 'Cần ôn lại bài học';
      scorePanel = `
        <div class="score-panel">
          <div class="score-ring ${tone}">${pct}%</div>
          <div class="score-info">
            <h3>${verdict}</h3>
            <p>Bạn trả lời đúng ${correct}/${questions.length} câu. Xem giải thích chi tiết bên dưới từng câu.</p>
          </div>
        </div>`;
    }

    const cards = questions.map((q, qi) => {
      const ua = answers[qi];
      const isCorrect = ua === q.answer;

      const opts = (q.options || []).map((opt, oi) => {
        let cls = 'q-opt';
        if (submitted) {
          if (oi === q.answer) cls += ' correct';
          else if (oi === ua)  cls += ' wrong';
        } else if (oi === ua) cls += ' selected';
        return `
          <button type="button" class="${cls}" data-qi="${qi}" data-oi="${oi}" ${submitted ? 'disabled' : ''}>
            <span class="q-opt-ltr">${LETTERS[oi] || oi + 1}</span>
            <span>${App.esc(String(opt).replace(/^\s*[A-F][.)]\s*/, ''))}</span>
          </button>`;
      }).join('');

      const flag = submitted
        ? `<span class="q-flag ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? 'Đúng' : 'Chưa đúng'}</span>`
        : '';

      return `
        <article class="q-card" id="q-${qi}">
          <div class="q-head">
            <span class="q-num">Câu ${qi + 1} / ${questions.length}</span>
            ${flag}
          </div>
          <div class="q-text">${App.esc(q.question)}</div>
          <div class="q-options" id="opts-${qi}">${opts}</div>
          <div class="q-explain ${submitted ? 'on' : ''}">
            <b>Giải thích</b>${App.esc(q.explanation || '')}
          </div>
        </article>`;
    }).join('');

    return scorePanel + cards;
  }

  function buildFooter() {
    return submitted
      ? `<button class="btn btn-secondary btn-lg" id="ev-quiz-review">${App.icon('list', 'ico-sm')}Xem lại từ đầu</button>
         <button class="btn btn-primary btn-lg" id="ev-quiz-retry">${App.icon('refresh', 'ico-sm')}Tạo bài mới</button>`
      : `<button class="btn btn-primary btn-lg" id="ev-quiz-submit" ${Object.keys(answers).length < questions.length ? 'disabled' : ''}>
           ${App.icon('check', 'ico-sm')}Nộp bài
         </button>`;
  }

  function buildActions() {
    if (!submitted) {
      return App.meterHTML(Object.keys(answers).length, questions.length);
    }
    const correct = countCorrect();
    const pct = Math.round(correct / questions.length * 100);
    return `<span class="ev-badge ${pct >= 80 ? 'good' : pct >= 50 ? '' : 'bad'}">
      ${App.icon('check-circle', 'ico-sm')}${correct}/${questions.length} câu đúng
    </span>`;
  }

  function openFullPage() {
    if (!questions.length) return;
    const hist = getHistory(currentLesson.id);
    App.openWork({
      title: submitted ? `Kết quả trắc nghiệm — ${currentLesson.title}` : `Trắc nghiệm — ${currentLesson.title}`,
      sub: `Day ${currentLesson.day} · ${questions.length} câu hỏi${hist.length > 1 ? ` · lần ${hist.length - histIndex}/${hist.length}` : ''}`,
      html: buildBody(),
      actions: buildActions(),
      footer: buildFooter()
    });
    bind();
  }

  function bind() {
    App.onWork('.q-opt', 'click', function () {
      if (submitted) return;
      const qi = +this.dataset.qi, oi = +this.dataset.oi;
      document.querySelectorAll(`#opts-${qi} .q-opt`).forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      answers[qi] = oi;

      const done = Object.keys(answers).length;
      App.setWorkProgress(done, questions.length);
      const submit = document.getElementById('ev-quiz-submit');
      if (submit) submit.disabled = done < questions.length;
    });

    document.getElementById('ev-quiz-submit')?.addEventListener('click', submit);
    document.getElementById('ev-quiz-retry') ?.addEventListener('click', () => currentLesson && generate(currentLesson));
    document.getElementById('ev-quiz-review')?.addEventListener('click', () => {
      document.getElementById('ev-body').scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const countCorrect = () => questions.reduce((n, q, qi) => n + (answers[qi] === q.answer ? 1 : 0), 0);

  // ─── Submit ──────────────────────────────────────────────
  function submit() {
    submitted = true;
    const correct = countCorrect();
    const total = questions.length;
    const pct = Math.round(correct / total * 100);

    if (currentLesson) {
      const full = loadHistory();
      const h = full[currentLesson.id];
      if (h?.[histIndex]) h[histIndex].result = { correct, total, pct, answers: { ...answers } };
      saveHistory(full);
      App.saveScore(currentLesson.id, 'mcq', { correct, total, pct });
    }

    openFullPage();
    refreshPanel();
    App.toast(`Kết quả: ${correct}/${total} câu đúng`, pct >= 50 ? 'success' : 'info');
  }

  // ─── Side panel state ────────────────────────────────────
  function refreshPanel() {
    const hist = getHistory(currentLesson?.id);
    const nav = $('quiz-hist-nav'), sel = $('quiz-hist-select');
    const result = $('quiz-result'), openBtn = $('quiz-open-btn'), empty = $('quiz-empty');

    if (!hist.length) {
      nav?.classList.add('hidden');
      result?.classList.add('hidden');
      openBtn?.classList.add('hidden');
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');
    openBtn?.classList.remove('hidden');

    nav?.classList.remove('hidden');
    if (sel) {
      sel.innerHTML = hist.map((e, i) => {
        const d = new Date(e.timestamp);
        const when = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const res = e.result ? `${e.result.correct}/${e.result.total}` : 'chưa nộp';
        return `<option value="${i}" ${i === histIndex ? 'selected' : ''}>Lần ${hist.length - i} · ${when} · ${res}</option>`;
      }).join('');
    }

    const entry = hist[histIndex];
    if (entry?.result) {
      result?.classList.remove('hidden');
      $('quiz-result-txt').textContent = `${entry.result.correct}/${entry.result.total} câu đúng`;
      $('quiz-result-val').textContent = entry.result.pct + '%';
    } else {
      result?.classList.add('hidden');
    }
  }

  function loadFromHistory(idx) {
    const hist = getHistory(currentLesson?.id);
    const entry = hist[idx];
    if (!entry) return;
    histIndex = idx;
    setQuiz(entry.questions, entry.result);
    refreshPanel();
  }

  // ─── Wiring ──────────────────────────────────────────────
  function setup() {
    $('gen-quiz-btn')?.addEventListener('click', () => currentLesson && generate(currentLesson));
    $('quiz-open-btn')?.addEventListener('click', openFullPage);
    $('quiz-hist-select')?.addEventListener('change', function () {
      loadFromHistory(parseInt(this.value, 10));
      openFullPage();
    });
  }

  function setLesson(lesson) {
    currentLesson = lesson;
    histIndex = 0;
    const btn = $('gen-quiz-btn');
    if (btn) btn.disabled = false;

    const hist = getHistory(lesson.id);
    if (hist.length) setQuiz(hist[0].questions, hist[0].result);
    else setQuiz([], null);
    refreshPanel();
  }

  setup();
  return { setLesson };
})();

window.QuizEngine = QuizEngine;
