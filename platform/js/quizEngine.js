// ═══════════════════════════════════════════════════════════
// quizEngine.js v6 — Trắc nghiệm ở chế độ TOÀN TRANG
//  · Chọn số câu, độ khó và dạng câu hỏi
//  · Có câu đọc code hỏi output / tìm lỗi
//  · Chống trùng lặp thật sự: lọc phía client theo vân tay câu hỏi
// ═══════════════════════════════════════════════════════════

const QuizEngine = (() => {
  const HIST_KEY  = 'aicb_quiz_mcq_hist_v4';
  const PREFS_KEY = 'aicb_quiz_prefs_v1';
  const LETTERS   = ['A', 'B', 'C', 'D', 'E', 'F'];

  const $ = id => document.getElementById(id);

  // ─── Tuỳ chọn ra đề ──────────────────────────────────────
  const DEFAULT_PREFS = { count: 10, difficulty: 'mixed', style: 'mixed' };
  let prefs = { ...DEFAULT_PREFS, ...safeParse(localStorage.getItem(PREFS_KEY)) };
  function safeParse(v) { try { return JSON.parse(v || '{}'); } catch { return {}; } }
  function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }

  const DIFF_LABEL = { basic: 'Cơ bản', applied: 'Vận dụng', advanced: 'Nâng cao', mixed: 'Hỗn hợp' };

  const DIFF_INSTR = {
    basic: `ĐỘ KHÓ: Cơ bản. Kiểm tra việc nắm chắc khái niệm nền tảng — nhưng vẫn phải CỤ THỂ:
hỏi về hành vi, ví dụ minh hoạ, hoặc phân biệt hai thứ dễ nhầm. Cấm hỏi định nghĩa thuộc lòng.`,
    applied: `ĐỘ KHÓ: Vận dụng. Mỗi câu đặt trong một tình huống cụ thể: đọc một đoạn code ngắn,
chọn tham số/cấu hình đúng, hoặc chẩn đoán một lỗi thường gặp khi triển khai.`,
    advanced: `ĐỘ KHÓ: Nâng cao. Đòi hỏi phân tích sâu: đánh đổi kiến trúc, edge case, debug đoạn code
phức tạp, tối ưu chi phí/độ trễ, hoặc những hiểu nhầm phổ biến ngay cả với người có kinh nghiệm.`,
    mixed: `ĐỘ KHÓ: Hỗn hợp — khoảng 30% cơ bản, 40% vận dụng, 30% nâng cao.
Sắp xếp các câu theo độ khó TĂNG DẦN từ câu đầu đến câu cuối.`
  };

  const STYLE_INSTR = {
    mixed: `PHÂN BỔ DẠNG CÂU HỎI: ít nhất 40% số câu phải là dạng đọc code (code_output hoặc code_debug),
phần còn lại chia cho concept, compare, scenario và config.`,
    code: `PHÂN BỔ DẠNG CÂU HỎI: ít nhất 70% số câu phải có đoạn code trong trường "code"
(chủ yếu code_output và code_debug), phần còn lại là config hoặc scenario.`,
    theory: `PHÂN BỔ DẠNG CÂU HỎI: chủ yếu concept, compare và scenario.
Vẫn phải có ít nhất 2 câu dạng code_output để kiểm tra khả năng đọc code.`
  };

  // Mỗi lần sinh đề chọn ngẫu nhiên vài góc tiếp cận để đề không lặp mô-típ
  const ANGLES = [
    'các lỗi thường gặp khi triển khai thực tế',
    'đánh đổi giữa chi phí, độ trễ và chất lượng',
    'đọc code và suy ra output chính xác',
    'chọn đúng tham số, ngưỡng hoặc cấu hình',
    'phân biệt các khái niệm dễ bị nhầm lẫn với nhau',
    'thứ tự các bước trong một pipeline',
    'cách hệ thống hành xử ở edge case hoặc khi đầu vào bất thường',
    'đọc log/output để chẩn đoán nguyên nhân sự cố',
    'so sánh hai phương án và chọn phương án phù hợp với ràng buộc cho trước'
  ];

  // ─── Lịch sử ─────────────────────────────────────────────
  const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch { return {}; } };
  const saveHistory = h => localStorage.setItem(HIST_KEY, JSON.stringify(h));
  const getHistory  = id => loadHistory()[id] || [];

  function addToHistory(lessonId, questions, meta) {
    const h = loadHistory();
    if (!h[lessonId]) h[lessonId] = [];
    h[lessonId].unshift({ questions, result: null, meta, timestamp: Date.now() });
    if (h[lessonId].length > 10) h[lessonId] = h[lessonId].slice(0, 10);
    saveHistory(h);
    return h[lessonId];
  }

  /** Vân tay câu hỏi: bỏ dấu, bỏ ký tự không phải chữ/số để so khớp gần đúng. */
  function fingerprint(q) {
    return (String(q.question || '') + ' ' + String(q.code || ''))
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .slice(0, 160);
  }

  function pastQuestions(lessonId) {
    return getHistory(lessonId).flatMap(h => h.questions || []);
  }

  // ─── Trạng thái ──────────────────────────────────────────
  let currentLesson = null;
  let questions = [];
  let answers = {};
  let submitted = false;
  let histIndex = 0;

  // ─── Prompt ──────────────────────────────────────────────
  function buildPrompt(lesson, need, excluded, attempt) {
    const exclude = excluded.length
      ? `\nCÁC CÂU ĐÃ RA TRƯỚC ĐÓ — TUYỆT ĐỐI KHÔNG LẶP LẠI Ý CỦA BẤT KỲ CÂU NÀO:\n` +
        excluded.slice(0, 40).map((q, i) => `${i + 1}. ${q.slice(0, 110)}`).join('\n') + '\n'
      : '';

    const picked = [...ANGLES].sort(() => Math.random() - 0.5).slice(0, 3);
    const nonce = Math.random().toString(36).slice(2, 8);

    return `Tạo ${need} câu hỏi trắc nghiệm cho bài học "${lesson.title}".
Chủ đề: ${lesson.topics.join(', ')}.
Bối cảnh: ${lesson.desc || ''}

${DIFF_INSTR[prefs.difficulty] || DIFF_INSTR.mixed}

${STYLE_INSTR[prefs.style] || STYLE_INSTR.mixed}

GÓC TIẾP CẬN CHO LẦN NÀY (mã đề ${nonce}${attempt ? `, lượt bổ sung ${attempt + 1}` : ''}) — hãy bám vào các góc này để đề khác hẳn những lần trước:
${picked.map(a => `- ${a}`).join('\n')}
${exclude}
QUY TẮC BẮT BUỘC:
1. Câu hỏi phải CỤ THỂ và kiểm tra hiểu sâu. NGHIÊM CẤM các câu chung chung như "X là gì?",
   "Đâu là định nghĩa của X?", "X dùng để làm gì?", "Ưu điểm của X là gì?".
2. Với câu dạng code: đặt đoạn code 4-15 dòng vào trường "code", nêu rõ ngôn ngữ ở "language",
   và hỏi output chính xác, giá trị biến cuối cùng, hoặc lỗi sẽ xảy ra.
   Code phải chạy được và liên quan trực tiếp tới chủ đề bài học.
3. Các phương án nhiễu phải HỢP LÝ và sai một cách tinh vi — không được sai lộ liễu,
   không dùng "Tất cả đều đúng" hay "Không đáp án nào đúng".
4. Mỗi câu kiểm tra một khía cạnh KHÁC NHAU. Không có hai câu cùng ý.
5. "answer" là chỉ số 0-3 ứng với vị trí trong "options". Đáp án đúng phải phân bố đều
   giữa các vị trí, không dồn vào một chỗ.
6. "explanation" phải nói rõ vì sao đáp án đúng đúng VÀ vì sao các phương án còn lại sai.
7. Bọc mọi định danh, giá trị hay đoạn code ngắn trong dấu backtick.
8. Không dùng emoji ở bất kỳ đâu.

Trả về DUY NHẤT JSON đúng định dạng sau, không kèm bất kỳ chữ nào khác:
{
  "questions": [
    {
      "type": "code_output | code_debug | concept | compare | scenario | config",
      "difficulty": "basic | applied | advanced",
      "question": "Nội dung câu hỏi",
      "code": "chuỗi code, dùng \\n để xuống dòng; bỏ trống nếu câu không có code",
      "language": "python",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "answer": 0,
      "explanation": "Vì sao đúng và vì sao các phương án khác sai."
    }
  ]
}`;
  }

  // ─── Kiểm tra & chuẩn hoá câu hỏi từ AI ──────────────────
  function normalize(q) {
    if (!q || typeof q.question !== 'string' || !q.question.trim()) return null;
    if (!Array.isArray(q.options) || q.options.length < 2) return null;

    const options = q.options.map(o => String(o).replace(/^\s*[A-F][.)]\s*/, '').trim()).filter(Boolean);
    if (options.length < 2) return null;

    const answer = Number(q.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;

    const diff = ['basic', 'applied', 'advanced'].includes(q.difficulty) ? q.difficulty : null;
    return {
      question: q.question.trim(),
      code: typeof q.code === 'string' && q.code.trim() ? q.code.replace(/\s+$/, '') : '',
      language: (q.language || 'python').toString().slice(0, 20),
      options,
      answer,
      explanation: String(q.explanation || '').trim(),
      difficulty: diff,
      type: typeof q.type === 'string' ? q.type : ''
    };
  }

  function parseQuestions(text) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI không trả về JSON hợp lệ');
    let data;
    try {
      data = JSON.parse(m[0]);
    } catch {
      // AI đôi khi để dấu phẩy thừa trước } hoặc ]
      data = JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1'));
    }
    if (!Array.isArray(data.questions)) throw new Error('JSON thiếu mảng "questions"');
    return data.questions;
  }

  // ─── Sinh đề ─────────────────────────────────────────────
  async function generate(lesson) {
    const btn = $('gen-quiz-btn'), thinking = $('quiz-thinking');
    const want = prefs.count;

    btn && (btn.disabled = true);
    thinking?.classList.remove('off');
    setThinking(`AI đang soạn ${want} câu hỏi…`);
    histIndex = 0;

    // Vân tay của mọi câu đã từng ra cho bài học này
    const seen = new Set(pastQuestions(lesson.id).map(fingerprint));
    const excludedText = pastQuestions(lesson.id).map(q => q.question).reverse();

    const collected = [];
    let dropped = 0;

    try {
      // Tối đa 2 lượt: lượt 2 chỉ xin bù số câu còn thiếu sau khi lọc trùng
      for (let attempt = 0; attempt < 2 && collected.length < want; attempt++) {
        const need = want - collected.length;
        if (attempt > 0) setThinking(`Đã lọc ${dropped} câu trùng — đang xin thêm ${need} câu mới…`);

        const raw = await AIEngine.callAI(
          buildPrompt(lesson, need, excludedText.concat(collected.map(q => q.question)), attempt),
          'Bạn là giảng viên AICB ra đề trắc nghiệm chất lượng cao. Chỉ trả về JSON đúng định dạng, không giải thích thêm.',
          { temperature: 0.95, maxTokens: Math.min(1200 + need * 420, 12000) }
        );

        for (const rawQ of parseQuestions(raw)) {
          const q = normalize(rawQ);
          if (!q) continue;
          const fp = fingerprint(q);
          if (seen.has(fp)) { dropped++; continue; }
          seen.add(fp);
          collected.push(q);
          if (collected.length >= want) break;
        }
      }

      if (!collected.length) throw new Error('Không nhận được câu hỏi mới nào');

      addToHistory(lesson.id, collected, { ...prefs });
      setQuiz(collected, null);
      refreshPanel();
      openFullPage();

      const short = collected.length < want;
      App.toast(
        short
          ? `Đã tạo ${collected.length}/${want} câu mới (đã lọc ${dropped} câu trùng)`
          : `Đã tạo ${collected.length} câu hỏi mới`,
        short ? 'info' : 'success'
      );
    } catch (e) {
      App.toast(e.message === 'no_api_key' ? 'Hãy nhập API Key trong phần Cài đặt' : 'Lỗi tạo quiz: ' + e.message, 'error');
    } finally {
      btn && (btn.disabled = false);
      thinking?.classList.add('off');
      setThinking('AI đang soạn câu hỏi…');
    }
  }

  function setThinking(msg) {
    const el = $('quiz-thinking');
    if (!el) return;
    const spinner = el.querySelector('.spinner');
    el.innerHTML = '';
    if (spinner) el.appendChild(spinner);
    el.appendChild(document.createTextNode(' ' + msg));
  }

  function setQuiz(qs, result) {
    questions = qs || [];
    answers   = result?.answers ? { ...result.answers } : {};
    submitted = !!result;
  }

  // ─── Hiển thị ────────────────────────────────────────────
  /** Escape rồi bật lại code nội tuyến `x`, in đậm **x** và xuống dòng. */
  function rich(s) {
    return App.esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

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

      const opts = q.options.map((opt, oi) => {
        let cls = 'q-opt';
        if (submitted) {
          if (oi === q.answer) cls += ' correct';
          else if (oi === ua)  cls += ' wrong';
        } else if (oi === ua) cls += ' selected';
        return `
          <button type="button" class="${cls}" data-qi="${qi}" data-oi="${oi}" ${submitted ? 'disabled' : ''}>
            <span class="q-opt-ltr">${LETTERS[oi] || oi + 1}</span>
            <span class="q-opt-body">${rich(opt)}</span>
          </button>`;
      }).join('');

      const diffBadge = q.difficulty
        ? `<span class="q-diff ${q.difficulty}">${DIFF_LABEL[q.difficulty]}</span>` : '';
      const flag = submitted
        ? `<span class="q-flag ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? 'Đúng' : 'Chưa đúng'}</span>` : '';

      const codeBlock = q.code ? `
        <div class="q-code">
          <div class="q-code-hd"><span>${App.esc(q.language)}</span></div>
          <pre><code>${App.esc(q.code)}</code></pre>
        </div>` : '';

      return `
        <article class="q-card" id="q-${qi}">
          <div class="q-head">
            <span class="q-num">Câu ${qi + 1} / ${questions.length}</span>
            <span class="q-tags">${diffBadge}${flag}</span>
          </div>
          <div class="q-text">${rich(q.question)}</div>
          ${codeBlock}
          <div class="q-options" id="opts-${qi}">${opts}</div>
          <div class="q-explain ${submitted ? 'on' : ''}">
            <b>Giải thích</b>${rich(q.explanation)}
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
    if (!submitted) return App.meterHTML(Object.keys(answers).length, questions.length);
    const correct = countCorrect();
    const pct = Math.round(correct / questions.length * 100);
    return `<span class="ev-badge ${pct >= 80 ? 'good' : pct >= 50 ? '' : 'bad'}">
      ${App.icon('check-circle', 'ico-sm')}${correct}/${questions.length} câu đúng
    </span>`;
  }

  function openFullPage() {
    if (!questions.length) return;
    const hist = getHistory(currentLesson.id);
    const meta = hist[histIndex]?.meta;
    const codeCount = questions.filter(q => q.code).length;
    const bits = [
      `Day ${currentLesson.day}`,
      `${questions.length} câu`,
      meta ? `độ khó ${DIFF_LABEL[meta.difficulty] || DIFF_LABEL.mixed}` : null,
      codeCount ? `${codeCount} câu đọc code` : null,
      hist.length > 1 ? `lần ${hist.length - histIndex}/${hist.length}` : null
    ].filter(Boolean);

    App.openWork({
      title: submitted ? `Kết quả trắc nghiệm — ${currentLesson.title}` : `Trắc nghiệm — ${currentLesson.title}`,
      sub: bits.join(' · '),
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
      const submitBtn = document.getElementById('ev-quiz-submit');
      if (submitBtn) submitBtn.disabled = done < questions.length;
    });

    document.getElementById('ev-quiz-submit')?.addEventListener('click', submit);
    document.getElementById('ev-quiz-retry') ?.addEventListener('click', () => currentLesson && generate(currentLesson));
    document.getElementById('ev-quiz-review')?.addEventListener('click', () =>
      document.getElementById('ev-body').scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const countCorrect = () => questions.reduce((n, q, qi) => n + (answers[qi] === q.answer ? 1 : 0), 0);

  // ─── Nộp bài ─────────────────────────────────────────────
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

  // ─── Bảng bên phải ───────────────────────────────────────
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
        const lv = e.meta ? ` · ${DIFF_LABEL[e.meta.difficulty] || ''}` : '';
        return `<option value="${i}" ${i === histIndex ? 'selected' : ''}>Lần ${hist.length - i} · ${e.questions.length} câu${lv} · ${when} · ${res}</option>`;
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
    const entry = getHistory(currentLesson?.id)[idx];
    if (!entry) return;
    histIndex = idx;
    setQuiz(entry.questions, entry.result);
    refreshPanel();
  }

  // ─── Gắn sự kiện ─────────────────────────────────────────
  function syncPrefsUI() {
    document.querySelectorAll('#quiz-count-seg button').forEach(b =>
      b.classList.toggle('active', +b.dataset.count === prefs.count));
    if ($('quiz-difficulty')) $('quiz-difficulty').value = prefs.difficulty;
    if ($('quiz-style'))      $('quiz-style').value = prefs.style;
    if ($('gen-quiz-lbl'))    $('gen-quiz-lbl').textContent = `Sinh ${prefs.count} câu trắc nghiệm`;
  }

  function setup() {
    document.querySelectorAll('#quiz-count-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        prefs.count = +btn.dataset.count;
        savePrefs();
        syncPrefsUI();
      });
    });
    $('quiz-difficulty')?.addEventListener('change', function () { prefs.difficulty = this.value; savePrefs(); });
    $('quiz-style')?.addEventListener('change', function () { prefs.style = this.value; savePrefs(); });

    $('gen-quiz-btn')?.addEventListener('click', () => currentLesson && generate(currentLesson));
    $('quiz-open-btn')?.addEventListener('click', openFullPage);
    $('quiz-hist-select')?.addEventListener('change', function () {
      loadFromHistory(parseInt(this.value, 10));
      openFullPage();
    });

    syncPrefsUI();
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
