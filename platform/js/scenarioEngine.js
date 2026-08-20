// ═══════════════════════════════════════════════════════════
// scenarioEngine.js v4 — Tự luận tình huống ở chế độ TOÀN TRANG
// ═══════════════════════════════════════════════════════════

const ScenarioEngine = (() => {
  const HIST_KEY = 'aicb_scenario_hist_v3';
  const $ = id => document.getElementById(id);

  const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch { return {}; } };
  const saveHistory = h => localStorage.setItem(HIST_KEY, JSON.stringify(h));
  const getHistory  = id => loadHistory()[id] || [];

  function addToHistory(lessonId, data) {
    const h = loadHistory();
    if (!h[lessonId]) h[lessonId] = [];
    h[lessonId].unshift({ data, result: null, timestamp: Date.now() });
    if (h[lessonId].length > 10) h[lessonId] = h[lessonId].slice(0, 10);
    saveHistory(h);
    return h[lessonId];
  }

  // ─── State ───────────────────────────────────────────────
  let currentLesson = null;
  let scenarios = [];
  let answers = [];
  let feedbackHtml = '';
  let submitted = false;
  let histIndex = 0;

  // ─── Generate ────────────────────────────────────────────
  async function generate(lesson) {
    const btn = $('gen-scenario-btn'), thinking = $('scenario-thinking');
    btn && (btn.disabled = true);
    thinking?.classList.remove('off');
    histIndex = 0;

    try {
      const past = getHistory(lesson.id).flatMap(h => h.data.map(s => `${s.title} — ${s.question}`)).slice(0, 6);
      const exclude = past.length
        ? `\nCÁC TÌNH HUỐNG ĐÃ RA TRƯỚC ĐÓ (KHÔNG LẶP LẠI):\n${past.map(q => `- ${q}`).join('\n')}\n`
        : '';

      const prompt = `Tạo 2 bài tập tình huống thực tế (tự luận) hoàn toàn mới cho bài "${lesson.title}" (${lesson.topics.join(', ')}).${exclude}

Trả về JSON (CHỈ JSON):
{
  "scenarios": [
    {
      "title": "Tên tình huống ngắn",
      "context": "Mô tả tình huống 3-5 câu, gắn với công ty hoặc dự án thực tế tại Việt Nam / Đông Nam Á",
      "question": "Câu hỏi yêu cầu học viên phân tích và áp dụng kiến thức",
      "hints": ["Gợi ý 1", "Gợi ý 2"],
      "sample_answer": "Gợi ý trả lời mẫu 3-4 câu"
    }
  ]
}

Tình huống phải sát thực tế, đòi hỏi phân tích và lập luận. Không dùng emoji.`;

      const text = await AIEngine.callAI(prompt, 'Bạn là giảng viên AICB soạn bài tập tình huống. Chỉ trả về JSON.');
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('AI không trả về JSON hợp lệ');
      const data = JSON.parse(m[0]);
      if (!data.scenarios?.length) throw new Error('Dữ liệu tình huống trống');

      addToHistory(lesson.id, data.scenarios);
      setData(data.scenarios, null);
      refreshPanel();
      openFullPage();
      App.toast('Đã tạo bài tự luận mới', 'success');
    } catch (e) {
      App.toast(e.message === 'no_api_key' ? 'Hãy nhập API Key trong phần Cài đặt' : 'Lỗi tạo tình huống: ' + e.message, 'error');
    } finally {
      btn && (btn.disabled = false);
      thinking?.classList.add('off');
    }
  }

  function setData(data, result) {
    scenarios = data || [];
    submitted = !!result;
    answers = result?.answers ? [...result.answers] : [];
    feedbackHtml = result?.aiFeedback ? AIEngine.renderMD(result.aiFeedback) : '';
  }

  // ─── Full-page rendering ─────────────────────────────────
  function buildBody() {
    const cards = scenarios.map((s, si) => `
      <article class="sc-card">
        <div class="sc-label">Tình huống ${si + 1} / ${scenarios.length}</div>
        <h2 class="sc-title">${App.esc(s.title)}</h2>
        <div class="sc-context">${App.esc(s.context)}</div>
        <div class="sc-question">${App.esc(s.question)}</div>
        ${s.hints?.length ? `
          <div class="sc-hints">
            ${App.icon('bulb', 'ico-sm')}
            <span>${s.hints.map(h => App.esc(h)).join(' · ')}</span>
          </div>` : ''}
        <textarea class="sc-textarea" id="sc-ta-${si}"
          placeholder="Viết phân tích của bạn ở đây…"
          ${submitted ? 'readonly' : ''}>${App.esc(answers[si] || '')}</textarea>
        <div class="sc-meta">
          <span id="sc-count-${si}">${wordCount(answers[si] || '')} từ</span>
          <span>${submitted ? 'Đã nộp' : 'Nên viết tối thiểu 80 từ'}</span>
        </div>
        <div class="sc-sample ${submitted ? 'on' : ''}">
          <b>Đáp án tham khảo</b>${App.esc(s.sample_answer || '')}
        </div>
      </article>`).join('');

    const feedback = submitted && feedbackHtml ? `
      <section class="feedback">
        <div class="feedback-hd">${App.icon('sparkle', 'ico-sm')}Nhận xét của AI</div>
        <div class="prose" style="border:none;padding:0">${feedbackHtml}</div>
      </section>` : '';

    return feedback + cards;
  }

  function buildFooter() {
    return submitted
      ? `<button class="btn btn-primary btn-lg" id="ev-sc-retry">${App.icon('refresh', 'ico-sm')}Tạo bài mới</button>`
      : `<button class="btn btn-primary btn-lg" id="ev-sc-submit">${App.icon('sparkle', 'ico-sm')}Nộp bài để AI chấm</button>`;
  }

  const wordCount = t => (String(t).trim() ? String(t).trim().split(/\s+/).length : 0);

  function openFullPage() {
    if (!scenarios.length) return;
    const hist = getHistory(currentLesson.id);
    App.openWork({
      title: submitted ? `Nhận xét tự luận — ${currentLesson.title}` : `Tự luận — ${currentLesson.title}`,
      sub: `Day ${currentLesson.day} · ${scenarios.length} tình huống${hist.length > 1 ? ` · lần ${hist.length - histIndex}/${hist.length}` : ''}`,
      html: buildBody(),
      footer: buildFooter()
    });
    bind();
  }

  function bind() {
    scenarios.forEach((_, si) => {
      const ta = document.getElementById(`sc-ta-${si}`);
      if (!ta) return;
      ta.addEventListener('input', () => {
        answers[si] = ta.value;
        const c = document.getElementById(`sc-count-${si}`);
        if (c) c.textContent = `${wordCount(ta.value)} từ`;
      });
    });

    document.getElementById('ev-sc-submit')?.addEventListener('click', submit);
    document.getElementById('ev-sc-retry') ?.addEventListener('click', () => currentLesson && generate(currentLesson));
  }

  // ─── Submit ──────────────────────────────────────────────
  async function submit() {
    scenarios.forEach((_, si) => {
      const ta = document.getElementById(`sc-ta-${si}`);
      if (ta) answers[si] = ta.value.trim();
    });

    if (scenarios.some((_, i) => !answers[i])) {
      App.toast('Hãy trả lời tất cả các tình huống trước khi nộp', 'error');
      return;
    }

    const btn = document.getElementById('ev-sc-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner" style="width:15px;height:15px;border-width:2px"></div>AI đang chấm…`; }

    try {
      const prompt = `Nhận xét bài tự luận của học viên AICB:

${scenarios.map((s, i) => `
**Tình huống ${i + 1}:** ${s.title}
Ngữ cảnh: ${s.context}
Câu hỏi: ${s.question}
Đáp án mẫu: ${s.sample_answer}
**Câu trả lời của học viên:** ${answers[i] || ''}
`).join('\n---\n')}

Với mỗi tình huống, nhận xét 3-4 câu: điểm làm tốt, điểm còn thiếu, gợi ý cải thiện, và chấm điểm X/10.
Kết thúc bằng nhận xét tổng và điểm trung bình. Dùng markdown, không dùng emoji.`;

      const text = await AIEngine.callAI(prompt, 'Bạn là giảng viên AICB chấm bài tự luận, nhận xét thẳng thắn và mang tính xây dựng.');

      submitted = true;
      feedbackHtml = AIEngine.renderMD(text);

      if (currentLesson) {
        const full = loadHistory();
        const h = full[currentLesson.id];
        if (h?.[histIndex]) h[histIndex].result = { answers: [...answers], aiFeedback: text };
        saveHistory(full);
      }

      openFullPage();
      refreshPanel();
      App.toast('AI đã chấm xong bài tự luận', 'success');
    } catch (e) {
      App.toast('Lỗi chấm bài: ' + e.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `${App.icon('sparkle', 'ico-sm')}Nộp bài để AI chấm`; }
    }
  }

  // ─── Side panel ──────────────────────────────────────────
  function refreshPanel() {
    const hist = getHistory(currentLesson?.id);
    const nav = $('scenario-hist-nav'), sel = $('scenario-hist-select');
    const result = $('scenario-result'), openBtn = $('scenario-open-btn'), empty = $('scenario-empty');

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
        return `<option value="${i}" ${i === histIndex ? 'selected' : ''}>Lần ${hist.length - i} · ${when} · ${e.result ? 'đã chấm' : 'chưa nộp'}</option>`;
      }).join('');
    }

    const entry = hist[histIndex];
    if (result) {
      result.classList.remove('hidden');
      $('scenario-result-txt').textContent = entry?.result ? 'Đã có nhận xét của AI' : 'Bài đang làm dở';
    }
  }

  function loadFromHistory(idx) {
    const entry = getHistory(currentLesson?.id)[idx];
    if (!entry) return;
    histIndex = idx;
    setData(entry.data, entry.result);
    refreshPanel();
  }

  // ─── Wiring ──────────────────────────────────────────────
  function setup() {
    $('gen-scenario-btn')?.addEventListener('click', () => currentLesson && generate(currentLesson));
    $('scenario-open-btn')?.addEventListener('click', openFullPage);
    $('scenario-hist-select')?.addEventListener('change', function () {
      loadFromHistory(parseInt(this.value, 10));
      openFullPage();
    });
  }

  function setLesson(lesson) {
    currentLesson = lesson;
    histIndex = 0;
    const btn = $('gen-scenario-btn');
    if (btn) btn.disabled = false;

    const hist = getHistory(lesson.id);
    if (hist.length) setData(hist[0].data, hist[0].result);
    else setData([], null);
    refreshPanel();
  }

  setup();
  return { setLesson };
})();

window.ScenarioEngine = ScenarioEngine;
