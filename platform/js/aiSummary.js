// ═══════════════════════════════════════════════════════════
// aiSummary.js — Gemini AI Summary for AICB Learning Platform
// ═══════════════════════════════════════════════════════════

const AISummary = (() => {
  const CACHE_KEY_PREFIX = 'aicb_summary_';

  const summaryContent = document.getElementById('summary-content');
  const summaryPlaceholder = document.getElementById('summary-placeholder');
  const generateBtn = document.getElementById('generate-summary-btn');
  const thinkingEl = document.getElementById('summary-thinking');
  const lessonTitleEl = document.getElementById('summary-lesson-title');
  const lessonSubEl = document.getElementById('summary-lesson-sub');
  const topicsSection = document.getElementById('topics-section');
  const topicsList = document.getElementById('topics-list');

  const detailBtns = document.querySelectorAll('.detail-btn');
  let detailLevel = 'simple';

  detailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      detailBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      detailLevel = btn.dataset.level;
    });
  });

  function getPrompt(lesson, level) {
    const levelInstructions = {
      simple: `Giải thích theo kiểu đơn giản nhất, dùng ví dụ thực tế đời thường, tránh jargon kỹ thuật. Phù hợp cho người mới bắt đầu.`,
      standard: `Giải thích ở mức chuẩn, cân bằng giữa dễ hiểu và đầy đủ kỹ thuật. Dùng ví dụ thực tế trong lĩnh vực AI/Tech.`,
      deep: `Giải thích chuyên sâu, đầy đủ kỹ thuật, có thể dùng thuật ngữ chuyên ngành. Phù hợp cho người đã có nền tảng kỹ thuật.`
    };

    const lang = App.getSettings().lang || 'mixed';
    const langInstr = lang === 'vi' ? 'Trả lời hoàn toàn bằng Tiếng Việt.' :
                      lang === 'en' ? 'Reply in English.' :
                      'Trả lời bằng Tiếng Việt, giữ nguyên thuật ngữ kỹ thuật bằng tiếng Anh.';

    return `Bạn là trợ lý học tập AI cho khóa học AICB (AI in Coding & Business) tại VinUniversity.

Bài học hiện tại: **${lesson.title}**
Mô tả: ${lesson.description}
Các chủ đề: ${lesson.topics.join(', ')}
Ngày học: Day ${lesson.day}

${levelInstructions[level]}
${langInstr}

Hãy tạo bản tóm tắt bài học với cấu trúc sau (dùng markdown):

## 💡 Tổng quan nhanh
Một đoạn 2-3 câu tóm tắt core idea của bài học.

## 🎯 Khái niệm chính
Liệt kê 4-6 khái niệm quan trọng nhất, mỗi khái niệm kèm giải thích ngắn gọn.

## 🌍 Ví dụ thực tế
Đưa ra 2-3 ví dụ thực tế, gần gũi để minh họa khái niệm.

## ⚡ Điểm cần nhớ
Bullet points tóm gọn những điều quan trọng nhất của bài.

## 🔗 Liên hệ bài học khác
Bài này kết nối thế nào với các bài học khác trong khóa AICB (nếu biết).

Giới hạn tổng cộng khoảng 400-600 từ. Viết súc tích, dễ hiểu.`;
  }

  function renderMarkdown(md) {
    // Simple markdown renderer
    return md
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^### (.+)$/gm, '<h4 style="font-size:0.78rem;color:var(--text-secondary);margin:10px 0 4px;">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[uh]|<p)(.+)$/gm, '$1')
      .trim();
  }

  function showTopics(lesson) {
    if (!topicsList || !topicsSection) return;
    topicsList.innerHTML = lesson.topics.map(t =>
      `<span class="topic-tag">${t}</span>`
    ).join('');
    topicsSection.style.display = 'block';
  }

  async function generate(lesson) {
    const apiKey = App.getSettings().apiKey;
    if (!apiKey) {
      App.toast('Vui lòng nhập API Key trong Cài đặt ⚙️', 'error');
      document.getElementById('settings-btn')?.click();
      return;
    }

    // Check cache
    const cacheKey = `${CACHE_KEY_PREFIX}${lesson.id}_${detailLevel}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      renderSummary(cached, lesson);
      App.toast('📋 Đã tải từ cache', 'info');
      return;
    }

    // Show thinking
    generateBtn.disabled = true;
    thinkingEl?.classList.remove('hidden');
    summaryPlaceholder?.classList.add('hidden');
    summaryContent?.classList.add('hidden');

    try {
      const model = App.getSettings().model || 'gemini-1.5-flash';
      const prompt = getPrompt(lesson, detailLevel);

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          })
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) throw new Error('Empty response from AI');

      // Cache it
      localStorage.setItem(cacheKey, text);
      renderSummary(text, lesson);
      App.toast('✅ Tóm tắt hoàn thành!', 'success');

    } catch (err) {
      console.error('Summary error:', err);
      App.toast(`Lỗi AI: ${err.message}`, 'error');
      summaryPlaceholder?.classList.remove('hidden');
    } finally {
      generateBtn.disabled = false;
      thinkingEl?.classList.add('hidden');
    }
  }

  function renderSummary(markdown, lesson) {
    if (!summaryContent) return;
    const html = typeof marked !== 'undefined'
      ? marked.parse(markdown)
      : renderMarkdown(markdown);
    summaryContent.innerHTML = html;
    summaryContent.classList.remove('hidden');
    summaryPlaceholder?.classList.add('hidden');
    thinkingEl?.classList.add('hidden');
    showTopics(lesson);
  }

  function setLesson(lesson) {
    if (lessonTitleEl) lessonTitleEl.textContent = lesson.title;
    if (lessonSubEl) lessonSubEl.textContent = lesson.subtitle;
    if (generateBtn) generateBtn.disabled = false;

    // Check cache
    const cacheKey = `${CACHE_KEY_PREFIX}${lesson.id}_${detailLevel}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      renderSummary(cached, lesson);
    } else {
      summaryContent?.classList.add('hidden');
      summaryPlaceholder?.classList.remove('hidden');
      showTopics(lesson);
    }
  }

  function setupListeners() {
    generateBtn?.addEventListener('click', () => {
      const lesson = App.getCurrentLesson();
      if (lesson) generate(lesson);
    });
  }

  setupListeners();
  return { setLesson, generate };
})();

window.AISummary = AISummary;
