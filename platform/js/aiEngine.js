// ═══════════════════════════════════════════════════════════
// aiEngine.js v3 — Lõi gọi AI (OpenAI-compatible) + Tóm tắt + Code lab
//  · Tóm tắt hiển thị trong bảng bên phải (nội dung đọc)
//  · Bài tập code chạy ở chế độ TOÀN TRANG
// ═══════════════════════════════════════════════════════════

const AIEngine = (() => {
  const HIST_KEY = 'aicb_summary_hist_v2';
  const CODE_KEY = 'aicb_code_v1';
  const $ = id => document.getElementById(id);

  const LEVEL_LABEL = { simple: 'Đơn giản', standard: 'Chuẩn', deep: 'Chuyên sâu' };

  // ─── Summary history ─────────────────────────────────────
  const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch { return {}; } };
  const saveHistory = h => localStorage.setItem(HIST_KEY, JSON.stringify(h));
  const getHistory  = id => loadHistory()[id] || [];

  function addToHistory(lessonId, level, text) {
    const h = loadHistory();
    if (!h[lessonId]) h[lessonId] = [];
    h[lessonId] = h[lessonId].filter(e => e.level !== level);
    h[lessonId].unshift({ level, text, timestamp: Date.now() });
    if (h[lessonId].length > 6) h[lessonId] = h[lessonId].slice(0, 6);
    saveHistory(h);
    return h[lessonId];
  }

  // ─── API ─────────────────────────────────────────────────
  /** Gọi endpoint chat/completions với danh sách message đầy đủ (giữ ngữ cảnh nhiều lượt). */
  async function chat(messages, { temperature = 0.7, maxTokens = 2000 } = {}) {
    const { apiKey, baseUrl, model } = App.getSettings();
    if (!apiKey) throw new Error('no_api_key');

    const url = (baseUrl || 'https://api.shopaikey.com/v1').replace(/\/+$/, '') + '/chat/completions';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || 'gpt-4o-mini', messages, temperature, max_tokens: maxTokens })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    // Loại emoji ngay tại nguồn: áp dụng cho tóm tắt, quiz, tự luận, flashcard, code và chatbot
    return App.clean(data.choices?.[0]?.message?.content || '');
  }

  /** Gọi AI với một prompt đơn. */
  function callAI(prompt, systemPrompt = '') {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    return chat(messages);
  }

  // ─── Markdown ────────────────────────────────────────────
  function renderMD(raw) {
    const text = App.clean(raw);
    if (typeof marked !== 'undefined') return marked.parse(text);
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^/, '<p>').replace(/$/, '</p>');
  }

  // ═══════════ SUMMARY ═══════════
  let summaryLesson = null;
  let summaryLevel  = 'simple';
  let summaryIndex  = 0;

  function initSummary() {
    document.querySelectorAll('#detail-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#detail-seg button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        summaryLevel = btn.dataset.lv;
      });
    });

    $('gen-summary-btn')?.addEventListener('click', () => summaryLesson && generateSummary(summaryLesson));
    $('summary-hist-select')?.addEventListener('change', function () {
      summaryIndex = parseInt(this.value, 10);
      renderHistEntry(summaryLesson.id);
    });
  }

  function renderEntry(entry) {
    const area = $('summary-area');
    if (!area) return;
    const d = new Date(entry.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' });
    area.innerHTML = `
      <div class="prose-meta">${App.icon('clock', 'ico-sm')}${d} · mức ${LEVEL_LABEL[entry.level] || ''}</div>
      <div class="prose">${renderMD(entry.text)}</div>`;
  }

  function renderHistEntry(lessonId) {
    const h = getHistory(lessonId);
    if (!h.length) return;
    renderEntry(h[summaryIndex] || h[0]);
    updateHistNav(lessonId);
  }

  function updateHistNav(lessonId) {
    const h = getHistory(lessonId);
    const nav = $('summary-hist-nav'), sel = $('summary-hist-select');
    if (!nav) return;
    if (!h.length) { nav.classList.add('hidden'); return; }
    nav.classList.remove('hidden');
    if (sel) {
      sel.innerHTML = h.map((e, i) => {
        const d = new Date(e.timestamp);
        const when = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `<option value="${i}" ${i === summaryIndex ? 'selected' : ''}>Mức ${LEVEL_LABEL[e.level]} · ${when}</option>`;
      }).join('');
    }
  }

  async function generateSummary(lesson) {
    const { lang } = App.getSettings();
    const langInstr = lang === 'en' ? 'Reply in English.'
      : lang === 'vi' ? 'Trả lời hoàn toàn bằng Tiếng Việt.'
      : 'Trả lời bằng Tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.';

    const levelInstr = {
      simple:   'Giải thích đơn giản nhất, dùng ví dụ đời thường, tránh thuật ngữ nặng.',
      standard: 'Cân bằng giữa kỹ thuật và dễ hiểu, dùng ví dụ thực tế.',
      deep:     'Chuyên sâu kỹ thuật đầy đủ, phù hợp người đã có nền tảng.'
    }[summaryLevel];

    const prompt = `Bài học: **${lesson.title}** (Day ${lesson.day})
Chủ đề: ${lesson.topics.join(', ')}
Mô tả: ${lesson.desc || ''}

${levelInstr} ${langInstr}

Tóm tắt bài học theo cấu trúc markdown, KHÔNG dùng emoji:

## Tổng quan nhanh
2-3 câu về ý tưởng cốt lõi.

## Khái niệm chính
4-6 gạch đầu dòng, mỗi khái niệm kèm giải thích ngắn.

## Ví dụ thực tế
2 ví dụ cụ thể gắn với thực tế.

## Điểm cần nhớ
3-5 gạch đầu dòng quan trọng nhất.

Tối đa 450 từ, súc tích và dễ đọc.`;

    const btn = $('gen-summary-btn'), thinking = $('summary-thinking'), area = $('summary-area');
    if (btn) btn.disabled = true;
    thinking?.classList.remove('off');
    if (area) area.innerHTML = '';

    try {
      const text = await callAI(prompt, 'Bạn là trợ lý học tập của khóa AICB VinUniversity. Giải thích rõ ràng, có cấu trúc, không dùng emoji.');
      const history = addToHistory(lesson.id, summaryLevel, text);
      summaryIndex = 0;
      renderEntry(history[0]);
      updateHistNav(lesson.id);
      showTopics(lesson);
      App.toast('Đã tóm tắt xong bài học', 'success');
    } catch (e) {
      if (e.message === 'no_api_key') {
        App.toast('Hãy nhập API Key trong phần Cài đặt', 'error');
        $('settings-open-btn')?.click();
      } else {
        App.toast('Lỗi gọi AI: ' + e.message, 'error');
      }
      if (area) area.innerHTML = `<div class="empty">${App.icon('alert')}<p>${App.esc(e.message)}</p></div>`;
    } finally {
      if (btn) btn.disabled = false;
      thinking?.classList.add('off');
    }
  }

  function showTopics(lesson) {
    const row = $('topics-row');
    if (!row) return;
    row.innerHTML = lesson.topics.map(t => `<span class="chip">${App.esc(t)}</span>`).join('');
    row.classList.remove('hidden');
  }

  function setSummaryLesson(lesson) {
    summaryLesson = lesson;
    summaryIndex = 0;
    $('s-title').textContent = lesson.title;
    $('s-sub').textContent   = `Day ${lesson.day} · ${lesson.instructor}`;
    $('gen-summary-btn').disabled = false;
    showTopics(lesson);

    const h = getHistory(lesson.id);
    if (h.length) {
      renderHistEntry(lesson.id);
    } else {
      $('summary-area').innerHTML = `<div class="empty">${App.icon('file')}<p>Nhấn “Tóm tắt bằng AI” để nhận bản tóm tắt có cấu trúc cho bài học này.</p></div>`;
      $('summary-hist-nav')?.classList.add('hidden');
    }
  }

  // ═══════════ CODE LAB (toàn trang) ═══════════
  let codeLesson = null;
  let challenge = null;   // { title, description, language, starter_code, concepts }
  let codeDraft = '';
  let codeFeedbackHtml = '';

  const loadCode = () => { try { return JSON.parse(localStorage.getItem(CODE_KEY) || '{}'); } catch { return {}; } };
  const saveCode = s => localStorage.setItem(CODE_KEY, JSON.stringify(s));

  function persistCode() {
    if (!codeLesson) return;
    const s = loadCode();
    s[codeLesson.id] = { challenge, draft: codeDraft };
    saveCode(s);
  }

  function initCodeLab() {
    $('gen-code-btn')?.addEventListener('click', () => codeLesson && generateChallenge(codeLesson));
    $('code-open-btn')?.addEventListener('click', openCodeFullPage);
  }

  async function generateChallenge(lesson) {
    const btn = $('gen-code-btn'), thinking = $('code-thinking');
    if (btn) btn.disabled = true;
    thinking?.classList.remove('off');

    try {
      const prompt = `Tạo một bài tập lập trình ngắn cho bài học "${lesson.title}" (${lesson.topics.slice(0, 3).join(', ')}).

Trả về JSON (CHỈ JSON):
{
  "title": "Tên bài tập ngắn",
  "description": "Mô tả yêu cầu cụ thể 2-3 câu",
  "language": "python",
  "starter_code": "# Code khung với các TODO\\n\\n",
  "concepts": ["khái niệm 1", "khái niệm 2"]
}

Không dùng emoji.`;

      const text = await callAI(prompt, 'Bạn là giảng viên AICB ra đề lập trình. Chỉ trả về JSON.');
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('AI không trả về JSON hợp lệ');

      challenge = JSON.parse(m[0]);
      codeDraft = challenge.starter_code || '';
      codeFeedbackHtml = '';
      persistCode();
      refreshCodePanel();
      openCodeFullPage();
      App.toast('Đã tạo bài tập lập trình', 'success');
    } catch (e) {
      App.toast(e.message === 'no_api_key' ? 'Hãy nhập API Key trong phần Cài đặt' : 'Lỗi tạo bài tập: ' + e.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
      thinking?.classList.add('off');
    }
  }

  function buildCodeBody() {
    if (!challenge) return '';
    return `
      <div class="code-grid">
        <section class="code-brief">
          <h3>${App.esc(challenge.title)}</h3>
          <p>${App.esc(challenge.description)}</p>
          ${challenge.concepts?.length ? `
            <div class="p-section-lbl" style="margin-top:18px">Kiến thức áp dụng</div>
            <div class="chips">${challenge.concepts.map(c => `<span class="chip">${App.esc(c)}</span>`).join('')}</div>` : ''}
          <div class="code-out" id="code-out">Chưa chạy kiểm tra</div>
        </section>

        <section>
          <div class="editor">
            <div class="editor-hd">
              <span class="editor-lang">${App.esc(challenge.language || 'python')}</span>
              <button class="btn btn-ghost" id="code-run">${App.icon('play', 'ico-sm')}Kiểm tra nhanh</button>
            </div>
            <textarea class="code-ta" id="code-ta" spellcheck="false" placeholder="# Viết code của bạn ở đây">${App.esc(codeDraft)}</textarea>
          </div>
        </section>
      </div>
      ${codeFeedbackHtml ? `
        <section class="feedback" style="margin-top:20px">
          <div class="feedback-hd">${App.icon('sparkle', 'ico-sm')}Nhận xét của AI</div>
          <div class="prose" style="border:none;padding:0">${codeFeedbackHtml}</div>
        </section>` : ''}`;
  }

  function openCodeFullPage() {
    if (!challenge) return;
    App.openWork({
      title: `Bài tập code — ${codeLesson.title}`,
      sub: `Day ${codeLesson.day} · ${challenge.title}`,
      html: buildCodeBody(),
      wide: true,
      footer: `
        <button class="btn btn-secondary btn-lg" id="code-new">${App.icon('refresh', 'ico-sm')}Đề bài khác</button>
        <button class="btn btn-primary btn-lg" id="code-submit">${App.icon('sparkle', 'ico-sm')}Nộp bài để AI chấm</button>`
    });
    bindCode();
  }

  function bindCode() {
    const ta = document.getElementById('code-ta');
    ta?.addEventListener('input', () => { codeDraft = ta.value; persistCode(); });
    ta?.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 4;
      codeDraft = ta.value;
    });

    document.getElementById('code-run')?.addEventListener('click', quickCheck);
    document.getElementById('code-new')?.addEventListener('click', () => codeLesson && generateChallenge(codeLesson));
    document.getElementById('code-submit')?.addEventListener('click', submitCode);
  }

  function quickCheck() {
    const out = document.getElementById('code-out');
    if (!out) return;
    const code = document.getElementById('code-ta')?.value || '';
    if (!code.trim()) { out.textContent = 'Chưa có code để kiểm tra'; return; }
    const lines = code.split('\n');
    const effective = lines.filter(l => l.trim() && !l.trim().startsWith('#')).length;
    const todos = (code.match(/TODO/gi) || []).length;
    out.textContent =
      `Đã quét ${lines.length} dòng (${effective} dòng lệnh)\n` +
      (todos ? `Còn ${todos} chỗ đánh dấu TODO chưa hoàn thành\n` : 'Không còn TODO nào\n') +
      `\nĐây chỉ là kiểm tra tĩnh — nhấn "Nộp bài để AI chấm" để nhận xét chi tiết.`;
  }

  async function submitCode() {
    const code = document.getElementById('code-ta')?.value || '';
    if (!code.trim()) { App.toast('Hãy viết code trước khi nộp', 'error'); return; }

    const btn = document.getElementById('code-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner" style="width:15px;height:15px;border-width:2px"></div>AI đang chấm…`; }

    try {
      const lang = challenge?.language || 'python';
      const prompt = `Nhận xét đoạn code sau của học viên AICB (bài "${codeLesson.title}", đề: ${challenge?.title}):

\`\`\`${lang}
${code}
\`\`\`

Nhận xét theo cấu trúc markdown, không dùng emoji:
1. **Điểm mạnh** — code làm tốt ở đâu
2. **Cần cải thiện** — thiếu sót, lỗi tiềm ẩn
3. **Gợi ý** — cách refactor hoặc tối ưu
4. **Điểm** — X/10 kèm lý do

Trả lời bằng Tiếng Việt, ngắn gọn và mang tính xây dựng.`;

      const text = await callAI(prompt, 'Bạn là giảng viên AICB review code.');
      codeFeedbackHtml = renderMD(text);
      openCodeFullPage();
      document.getElementById('ev-body').scrollTo({ top: 0, behavior: 'smooth' });
      App.toast('AI đã chấm xong bài code', 'success');
    } catch (e) {
      App.toast('Lỗi chấm bài: ' + e.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `${App.icon('sparkle', 'ico-sm')}Nộp bài để AI chấm`; }
    }
  }

  function refreshCodePanel() {
    const result = $('code-result'), openBtn = $('code-open-btn'), empty = $('code-empty');
    if (!challenge) {
      result?.classList.add('hidden');
      openBtn?.classList.add('hidden');
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');
    openBtn?.classList.remove('hidden');
    result?.classList.remove('hidden');
    $('code-result-txt').textContent = challenge.title;
  }

  function setCodeLesson(lesson) {
    codeLesson = lesson;
    $('gen-code-btn').disabled = false;
    const saved = loadCode()[lesson.id];
    challenge = saved?.challenge || null;
    codeDraft = saved?.draft || challenge?.starter_code || '';
    codeFeedbackHtml = '';
    refreshCodePanel();
  }

  initSummary();
  initCodeLab();

  return { setSummaryLesson, setCodeLesson, callAI, chat, renderMD };
})();

window.AIEngine = AIEngine;
