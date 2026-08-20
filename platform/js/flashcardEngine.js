// ═══════════════════════════════════════════════════════════
// flashcardEngine.js v2 — Thẻ ghi nhớ, học ở chế độ TOÀN TRANG
// ═══════════════════════════════════════════════════════════

const FlashcardEngine = (() => {
  const STORE_KEY = 'aicb_flashcard_v2';
  const $ = id => document.getElementById(id);

  const loadStore = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } };
  const saveStore = s => localStorage.setItem(STORE_KEY, JSON.stringify(s));

  let currentLesson = null;
  let cards = [];
  let index = 0;

  // ─── Generate ────────────────────────────────────────────
  async function generate(lesson) {
    const btn = $('gen-flashcard-btn'), thinking = $('flashcard-thinking');
    btn && (btn.disabled = true);
    thinking?.classList.remove('off');

    try {
      const prompt = `Trích xuất các khái niệm và thuật ngữ kỹ thuật quan trọng nhất của bài học "${lesson.title}" (${lesson.topics.join(', ')}) thành bộ thẻ ghi nhớ.

Trả về JSON (CHỈ JSON):
{
  "flashcards": [
    { "term": "Thuật ngữ ngắn gọn", "definition": "Định nghĩa dễ hiểu, 2-3 câu" }
  ]
}

Từ 8 đến 12 thẻ. Không dùng emoji.`;

      const text = await AIEngine.callAI(prompt, 'Bạn là hệ thống tạo thẻ ghi nhớ học thuật. Chỉ trả về JSON.');
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('AI không trả về JSON hợp lệ');
      const data = JSON.parse(m[0]);
      if (!data.flashcards?.length) throw new Error('Dữ liệu thẻ trống');

      cards = data.flashcards;
      index = 0;

      const store = loadStore();
      store[lesson.id] = cards;
      saveStore(store);

      refreshPanel();
      openFullPage();
      App.toast(`Đã tạo ${cards.length} thẻ ghi nhớ`, 'success');
    } catch (e) {
      App.toast(e.message === 'no_api_key' ? 'Hãy nhập API Key trong phần Cài đặt' : 'Lỗi tạo thẻ: ' + e.message, 'error');
    } finally {
      btn && (btn.disabled = false);
      thinking?.classList.add('off');
    }
  }

  // ─── Full-page study ─────────────────────────────────────
  function buildBody() {
    const c = cards[index];
    if (!c) return '';
    return `
      <div class="fc-stage">
        <div class="fc-card" id="fc-card" role="button" tabindex="0" aria-label="Lật thẻ">
          <div class="fc-inner">
            <div class="fc-face">
              <span class="fc-kicker">Thuật ngữ</span>
              <div class="fc-term">${App.esc(c.term)}</div>
            </div>
            <div class="fc-face fc-back">
              <span class="fc-kicker">Giải nghĩa</span>
              <div class="fc-def">${App.esc(c.definition)}</div>
            </div>
          </div>
        </div>
        <div class="fc-hint">Nhấn vào thẻ hoặc phím Space để lật · dùng phím mũi tên để chuyển thẻ</div>
      </div>`;
  }

  function buildFooter() {
    return `
      <button class="btn btn-secondary btn-lg" id="fc-prev" ${index === 0 ? 'disabled' : ''}>
        ${App.icon('chevron-left', 'ico-sm')}Thẻ trước
      </button>
      <span class="fc-count">${index + 1} / ${cards.length}</span>
      <button class="btn btn-secondary btn-lg" id="fc-next" ${index >= cards.length - 1 ? 'disabled' : ''}>
        Thẻ sau${App.icon('chevron-right', 'ico-sm')}
      </button>`;
  }

  function openFullPage() {
    if (!cards.length) return;
    App.openWork({
      title: `Thẻ ghi nhớ — ${currentLesson.title}`,
      sub: `Day ${currentLesson.day} · ${cards.length} thẻ`,
      html: buildBody(),
      actions: App.meterHTML(index + 1, cards.length, 'Thẻ'),
      footer: buildFooter()
    });
    bind();
  }

  function step(delta) {
    const next = index + delta;
    if (next < 0 || next >= cards.length) return;
    index = next;
    openFullPage();
  }

  function bind() {
    const card = document.getElementById('fc-card');
    const flip = () => card?.classList.toggle('flipped');
    card?.addEventListener('click', flip);
    card?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    document.getElementById('fc-prev')?.addEventListener('click', () => step(-1));
    document.getElementById('fc-next')?.addEventListener('click', () => step(1));
  }

  // Phím tắt chỉ hoạt động khi đang mở phiên học thẻ
  document.addEventListener('keydown', e => {
    if (!App.isWorkOpen() || !document.getElementById('fc-card')) return;
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
    if (e.key === ' ')          { e.preventDefault(); document.getElementById('fc-card')?.classList.toggle('flipped'); }
  });

  // ─── Side panel ──────────────────────────────────────────
  function refreshPanel() {
    const result = $('flashcard-result'), openBtn = $('flashcard-open-btn'), empty = $('flashcard-empty');
    if (!cards.length) {
      result?.classList.add('hidden');
      openBtn?.classList.add('hidden');
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');
    openBtn?.classList.remove('hidden');
    result?.classList.remove('hidden');
    $('flashcard-result-txt').textContent = `${cards.length} thẻ`;
  }

  function setup() {
    $('gen-flashcard-btn')?.addEventListener('click', () => currentLesson && generate(currentLesson));
    $('flashcard-open-btn')?.addEventListener('click', () => { index = 0; openFullPage(); });
  }

  function setLesson(lesson) {
    currentLesson = lesson;
    index = 0;
    const btn = $('gen-flashcard-btn');
    if (btn) btn.disabled = false;
    cards = loadStore()[lesson.id] || [];
    refreshPanel();
  }

  setup();
  return { setLesson };
})();

window.FlashcardEngine = FlashcardEngine;
