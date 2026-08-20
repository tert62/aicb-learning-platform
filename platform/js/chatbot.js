// ═══════════════════════════════════════════════════════════
// chatbot.js v3 — Trợ lý AI theo ngữ cảnh bài học (không dùng emoji)
// ═══════════════════════════════════════════════════════════

const Chatbot = (() => {
  let isOpen = false;
  let isTyping = false;
  let conversation = [];
  let activeLesson = null;

  const $ = id => document.getElementById(id);
  const win   = () => $('chatbot-win');
  const msgs  = () => $('cb-msgs');
  const input = () => $('cb-input');

  const BOT_AV  = () => `<div class="cb-msg-av">${App.icon('bot', 'ico-sm')}</div>`;
  const USER_AV = () => `<div class="cb-msg-av">${App.icon('user', 'ico-sm')}</div>`;

  // ─── Open / close ─────────────────────────────────────────
  function open()  { isOpen = true;  win()?.classList.add('open'); input()?.focus(); }
  function close() { isOpen = false; win()?.classList.remove('open'); }
  function toggle(){ isOpen ? close() : open(); }

  // ─── Lesson context ───────────────────────────────────────
  function setLesson(lesson) {
    const isNew = activeLesson?.id !== lesson.id;
    activeLesson = lesson;

    const ctx = $('cb-ctx');
    if (ctx) ctx.textContent = `Đang hỗ trợ: ${lesson.title} — Day ${lesson.day}`;

    const sugg = $('cb-sugg');
    if (sugg) {
      sugg.innerHTML = getSuggestions(lesson)
        .map(q => `<button class="cb-sugg-chip" data-q="${App.esc(q)}">${App.esc(q)}</button>`).join('');
      sugg.querySelectorAll('.cb-sugg-chip').forEach(el =>
        el.addEventListener('click', () => sendMsg(el.dataset.q)));
    }

    if (isNew) {
      conversation = [];
      addBotMsg(`Đã chuyển sang bài <strong>${App.esc(lesson.title)}</strong>. Hỏi tôi về ${App.esc(lesson.topics.slice(0, 2).join(', '))} hoặc bất kỳ nội dung nào trong bài.`);
    }
  }

  function getSuggestions(lesson) {
    const map = {
      'LLM':    ['Transformer hoạt động thế nào?', 'Vì sao GPT mạnh hơn các model trước?'],
      'RAG':    ['RAG khác fine-tuning thế nào?', 'Chiến lược chunking nào hiệu quả?'],
      'Agent':  ['ReAct pattern là gì?', 'Khi nào nên dùng multi-agent?'],
      'Prompt': ['Viết system prompt hiệu quả?', 'Chain-of-thought là gì?'],
      'Cloud':  ['Kubernetes và Docker khác nhau ra sao?', 'Serverless có hợp cho AI không?'],
      'Data':   ['Embedding là gì?', 'Vector database khác RDBMS thế nào?'],
    };
    for (const [key, qs] of Object.entries(map)) {
      if (lesson.topics.some(t => t.includes(key))) return qs;
    }
    return [
      `${lesson.topics[0]} là gì?`,
      `Ứng dụng thực tế của ${lesson.title}?`,
      `Nên bắt đầu học ${lesson.topics[0]} từ đâu?`
    ];
  }

  // ─── Messages ─────────────────────────────────────────────
  function push(cls, avatar, html) {
    const box = msgs();
    if (!box) return;
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = `${avatar}<div class="cb-bubble">${html}</div>`;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }
  const addBotMsg  = html => push('cb-msg', BOT_AV(), html);
  const addUserMsg = text => push('cb-msg user', USER_AV(), App.esc(text));

  function showTyping() {
    const box = msgs();
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'cb-msg';
    el.id = 'cb-typing';
    el.innerHTML = `${BOT_AV()}<div class="typing"><span></span><span></span><span></span></div>`;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }
  const removeTyping = () => $('cb-typing')?.remove();

  function formatReply(text) {
    if (typeof marked !== 'undefined') return marked.parse(text);
    return App.esc(text).replace(/\n/g, '<br>');
  }

  // ─── Send ─────────────────────────────────────────────────
  async function sendMsg(text) {
    const userText = (text || input()?.value || '').trim();
    if (!userText || isTyping) return;
    if (input()) { input().value = ''; input().style.height = 'auto'; }

    addUserMsg(userText);
    conversation.push({ role: 'user', content: userText });
    isTyping = true;
    $('cb-send').disabled = true;
    showTyping();

    try {
      const { lang } = App.getSettings();
      const langInstr = lang === 'en'
        ? 'Reply in English.'
        : 'Trả lời bằng Tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.';

      const sysPrompt = activeLesson
        ? `Bạn là trợ lý học tập của khóa AICB VinUniversity. Học viên đang xem bài "${activeLesson.title}" (Day ${activeLesson.day}), chủ đề: ${activeLesson.topics.join(', ')}. Ưu tiên giải thích gắn với bài học. ${langInstr} Trả lời ngắn gọn, rõ ràng, dùng code block khi có code. Không dùng emoji.`
        : `Bạn là trợ lý học tập của khóa AICB VinUniversity. ${langInstr} Không dùng emoji.`;

      const reply = await AIEngine.chat(
        [{ role: 'system', content: sysPrompt }, ...conversation.slice(-12)],
        { temperature: 0.75, maxTokens: 800 }
      );

      conversation.push({ role: 'assistant', content: reply });
      removeTyping();
      addBotMsg(formatReply(reply));
    } catch (e) {
      removeTyping();
      addBotMsg(e.message === 'no_api_key'
        ? 'Hãy nhập API Key trong phần Cài đặt để tôi có thể trả lời.'
        : `Không gọi được AI: ${App.esc(e.message)}`);
    } finally {
      isTyping = false;
      $('cb-send').disabled = false;
      input()?.focus();
    }
  }

  // ─── Setup ────────────────────────────────────────────────
  function setup() {
    $('chatbot-fab')?.addEventListener('click', toggle);
    $('cb-close')?.addEventListener('click', close);
    $('cb-send')?.addEventListener('click', () => sendMsg());

    input()?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    input()?.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 110) + 'px';
    });

    document.querySelectorAll('.cb-sugg-chip').forEach(el =>
      el.addEventListener('click', () => sendMsg(el.dataset.q)));
  }

  setup();
  return { open, close, toggle, setLesson };
})();

window.Chatbot = Chatbot;
