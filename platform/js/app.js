// ═══════════════════════════════════════════════════════════
// app.js v5 — Main controller
//  · Không dùng emoji: toàn bộ biểu tượng là SVG sprite
//  · Quiz / Tự luận / Flashcard / Code chạy ở chế độ TOÀN TRANG
// ═══════════════════════════════════════════════════════════

const SETTINGS_KEY = 'aicb_settings_v2';
const PROGRESS_KEY = 'aicb_progress_v2';
const SCORES_KEY   = 'aicb_scores_v2';

let settings = {
  apiKey: '',
  baseUrl: 'https://api.shopaikey.com/v1',
  model: 'gpt-5.6-luna',
  lang: 'mixed',
  ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
};
let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
let scores   = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
let currentLesson = null;
let currentTrack  = 'phase1';

const $ = id => document.getElementById(id);

// ─── Helpers ──────────────────────────────────────────────
function icon(name, cls = '') {
  return `<svg class="ico ${cls}"><use href="#i-${name}"/></svg>`;
}
// Ký tự emoji / pictograph — nền tảng dùng bộ icon SVG nên mọi emoji đều bị loại bỏ,
// kể cả emoji do AI sinh ra hoặc còn sót trong dữ liệu đã lưu từ trước.
const EMOJI_CLASS = '[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE00}-\\u{FE0F}\\u{200D}\\u{20E3}\\u{2049}\\u{203C}\\u{2122}\\u{2139}\\u{24C2}\\u{3030}\\u{303D}\\u{3297}\\u{3299}]';
const EMOJI_RUN_RE = new RegExp(`([ \\t]*)(?:${EMOJI_CLASS})+([ \\t]*)`, 'gu');

/**
 * Bỏ emoji cùng khoảng trắng thừa mà nó để lại.
 * Chỉ đụng tới khoảng trắng NẰM SÁT emoji — thụt lề của code trong JSON do AI
 * trả về được giữ nguyên tuyệt đối.
 */
function clean(s) {
  const str = String(s ?? '');
  return str
    .replace(EMOJI_RUN_RE, (m, pre, post, off) => {
      const before = str[off - 1];
      const after  = str[off + m.length];
      // emoji nằm giữa hai ký tự trên cùng một dòng -> thu về đúng một khoảng trắng
      if (before && after && before !== '\n' && after !== '\n' && (pre || post)) return ' ';
      return '';
    })
    .split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n');
}

function esc(s) {
  return clean(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Global App API ───────────────────────────────────────
window.App = {
  getCurrentLesson: () => currentLesson,
  getSettings: () => settings,
  toast: showToast,
  icon,
  esc,
  clean,

  saveScore: (id, type, score) => {
    if (!id) return;
    if (!scores[id]) scores[id] = {};
    scores[id][type] = { ...score, date: Date.now() };
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    updateStats();
  },

  /**
   * Mở chế độ làm bài toàn trang.
   * @param {{title:string, sub?:string, html:string, actions?:string, footer?:string, wide?:boolean}} o
   */
  openWork(o) {
    $('ev-title').textContent = o.title || '';
    $('ev-sub').textContent   = o.sub || '';
    $('ev-actions').innerHTML = o.actions || '';
    $('ev-content').innerHTML = o.html || '';
    $('ev-content').classList.toggle('wide', !!o.wide);

    const footer = $('ev-footer');
    footer.innerHTML = o.footer || '';
    footer.classList.toggle('hidden', !o.footer);

    $('exercise-view').classList.add('open');
    $('ev-body').scrollTop = 0;
  },

  closeWork() {
    $('exercise-view').classList.remove('open');
    $('ev-content').innerHTML = '';
    $('ev-footer').innerHTML = '';
    $('ev-footer').classList.add('hidden');
    PDFViewer.rerender();
  },

  isWorkOpen: () => $('exercise-view').classList.contains('open'),

  /** Gắn sự kiện cho phần tử bên trong chế độ toàn trang (gồm cả thanh trên/dưới). */
  onWork(selector, event, cb) {
    $('exercise-view').querySelectorAll(selector).forEach(el => el.addEventListener(event, cb));
  },

  /** Cập nhật đồng hồ tiến độ trên thanh tiêu đề của chế độ toàn trang. */
  setWorkProgress(done, total, label = 'Đã trả lời') {
    const fill = document.querySelector('.ev-meter-fill');
    const txt  = document.querySelector('.ev-meter-txt');
    if (fill) fill.style.width = total ? (done / total * 100) + '%' : '0%';
    if (txt)  txt.textContent = `${label} ${done}/${total}`;
  },

  /** Markup đồng hồ tiến độ, đặt vào vùng actions của thanh tiêu đề. */
  meterHTML(done, total, label = 'Đã trả lời') {
    return `
      <div class="ev-meter">
        <span class="ev-meter-txt">${label} ${done}/${total}</span>
        <div class="ev-meter-bar"><div class="ev-meter-fill" style="width:${total ? done / total * 100 : 0}%"></div></div>
      </div>`;
  }
};

// ─── Curriculum ───────────────────────────────────────────
const CURRICULUM = {
  phase1: {
    id:'phase1', label:'Phase 1', note:'Nền tảng chung',
    days: [
      { id:'d1',  day:1,  file:'../Slide/Day1.pdf',  ft:'pdf', title:'AI & LLM Foundation',                instructor:'Huỳnh Thành Trung', subtitle:'Nền tảng — Hiểu LLM từ gốc rễ',                    topics:['LLM','Transformer','Foundation Models','AI Basics'],          desc:'Giới thiệu AI và LLM, cơ chế Transformer, các mô hình nền tảng.' },
      { id:'d2',  day:2,  file:'../Slide/Day2.pdf',  ft:'pdf', title:'Xác Định Bài Toán Kinh Doanh',       instructor:'Nguyễn Tiến Đồng',   subtitle:'Chọn đúng bài toán AI',                              topics:['Business Problem','AI Strategy','Automation','ROI'],           desc:'Phân tích và chọn bài toán kinh doanh phù hợp với AI.' },
      { id:'d3',  day:3,  file:'../Slide/Day3.pdf',  ft:'pdf', title:'Từ Chatbot Đến Agentic Agent',       instructor:'AICB Faculty',       subtitle:'Design Pattern ReAct',                               topics:['Agent','ReAct Pattern','Agentic AI','Tool Use'],               desc:'Sự khác biệt chatbot vs Agentic AI, implement ReAct.' },
      { id:'d4',  day:4,  file:'../Slide/Day4.pdf',  ft:'pdf', title:'Prompt Engineering & Tool Calling',  instructor:'AICB Faculty',       subtitle:'Làm sao nói để AI hiểu đúng ý?',                     topics:['Prompt Engineering','Tool Calling','Few-shot','CoT'],          desc:'Kỹ thuật prompt, function calling, few-shot learning.' },
      { id:'d5',  day:5,  file:'../Slide/Day6.pdf',  ft:'pdf', title:'Thiết Kế Sản Phẩm AI',               instructor:'Mai Anh Nguyen Blue',subtitle:'Từ model đến trải nghiệm đáng tin',                  topics:['Product Design','AI UX','Reliability','Uncertainty'],          desc:'Nguyên tắc thiết kế sản phẩm AI khi model không hoàn hảo.' },
      { id:'d7',  day:7,  file:'../Slide/Day7.pdf',  ft:'pdf', title:'Data Foundations',                   instructor:'Trần Minh Tú (M.Sc)',subtitle:'Embedding & Vector Store',                           topics:['Embeddings','Vector Database','FAISS','Similarity Search'],    desc:'Vector embeddings, cơ sở dữ liệu vector, similarity search.' },
      { id:'d8',  day:8,  file:'../Slide/Day8.pdf',  ft:'pdf', title:'RAG Pipeline',                       instructor:'AICB Faculty',       subtitle:'Truy xuất & sinh câu trả lời',                       topics:['RAG','Retrieval','Chunking','Reranking','Generation'],         desc:'Xây dựng pipeline RAG từ ingestion đến retrieval.' },
      { id:'d9',  day:9,  file:'../Slide/Day9.pdf',  ft:'pdf', title:'Multi-Agent & Kết Nối Hệ Thống',     instructor:'AICB Faculty',       subtitle:'MCP, A2A & LangGraph',                               topics:['Multi-Agent','MCP','A2A','LangGraph','Orchestration'],         desc:'Thiết kế multi-agent, giao tiếp giữa các agent.' },
      { id:'d10', day:10, file:'../Slide/Day10.pdf', ft:'pdf', title:'Data Pipeline & Observability',      instructor:'Trần Quang Thiện',   subtitle:'Đường ống dữ liệu cho AI',                           topics:['Data Pipeline','Observability','Data Quality','ETL'],          desc:'Xây dựng và vận hành data pipeline cho AI.' },
      { id:'d11', day:11, file:'../Slide/Day11.pdf', ft:'pdf', title:'Guardrails & AI Safety',             instructor:'AICB Faculty',       subtitle:'Ai kiểm soát agent mạnh?',                           topics:['AI Safety','Guardrails','Alignment','Red Teaming'],            desc:'Kỹ thuật guardrails, alignment, phòng chống misuse.' },
      { id:'d12', day:12, file:'../Slide/Day12.pdf', ft:'pdf', title:'Deployment — Đưa Agent Lên Cloud',   instructor:'AICB Faculty',       subtitle:'Từ localhost đến production URL',                    topics:['Cloud Deployment','Docker','FastAPI','CI/CD'],                 desc:'Deploy AI agent, containerization, CI/CD pipeline.' },
      { id:'d13', day:13, file:'../Slide/Day13.pdf', ft:'pdf', title:'Monitoring & Observability',         instructor:'AICB Faculty',       subtitle:'Biết agent chạy thế nào trước khi user phàn nàn',    topics:['Monitoring','Logging','Tracing','Alerting'],                   desc:'Monitoring AI agents, structured logging, distributed tracing.' },
      { id:'d14', day:14, file:'../Slide/Day14.pdf', ft:'pdf', title:'AI Evaluation & Benchmarking',       instructor:'AICB Faculty',       subtitle:'Đo lường AI một cách khoa học',                      topics:['Evaluation','Benchmarking','RAGAS','LLM-as-Judge'],            desc:'Framework đánh giá AI, RAGAS cho RAG, LLM-as-Judge.' },
    ]
  },
  track2: {
    id:'track2', label:'Track 2', note:'Hạ tầng & dữ liệu',
    days: [
      { id:'t2d16', day:16, file:'../Track2/Day16-Track2.pdf',                                  ft:'pdf',  title:'Cloud Infrastructure for AI',   instructor:'AICB Faculty', subtitle:'Nền tảng đám mây cho AI',        topics:['Cloud','GCP','AWS','Kubernetes'],                  desc:'Thiết kế hạ tầng đám mây cho AI workloads.' },
      { id:'t2d17', day:17, file:'../Track2/Day17-Track2.pdf',                                  ft:'pdf',  title:'Data Pipeline Engineering',     instructor:'AICB Faculty', subtitle:'Xây đường ống dữ liệu nuôi AI',  topics:['Data Pipeline','Kafka','Airflow','Spark'],          desc:'Data pipeline batch và streaming.' },
      { id:'t2d18', day:18, file:'../Track2/Day18-Track2.pdf',                                  ft:'pdf',  title:'Data Lakehouse Architecture',   instructor:'AICB Faculty', subtitle:'Kết hợp Data Lake + Warehouse',  topics:['Lakehouse','Delta Lake','Iceberg','Medallion'],     desc:'Kiến trúc Lakehouse hiện đại.' },
      { id:'t2d19', day:19, file:'../Track2/Day19-Track2.pdf',                                  ft:'pdf',  title:'Vector Store & Feature Store',  instructor:'Phạm Mạnh',    subtitle:'Lưu trữ và quản lý features ML', topics:['Vector Store','Feature Store','Pinecone','Feast'],  desc:'Vector databases, Feature Store với Feast.' },
      { id:'t2d20', day:20, file:'../Track2/Day20-Track2.pdf',                                  ft:'pdf',  title:'Model Serving & Inference Optimization', instructor:'AICB Faculty', subtitle:'Hạ tầng phục vụ mô hình',          topics:['Model Serving', 'Inference', 'Optimization'],       desc:'Các kỹ thuật tối ưu hóa phục vụ mô hình AI và giảm độ trễ.' },
      { id:'t2d21', day:21, file:'../Track2/Day 21-Track2.pdf',                                 ft:'pdf',  title:'Day 21',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 21',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d22', day:22, file:'../Track2/Day 22-Track2.pdf',                                 ft:'pdf',  title:'Day 22',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 22',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d23', day:23, file:'../Track2/Day23-Track2.pdf',                                  ft:'pdf',  title:'Day 23',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 23',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d24', day:24, file:'../Track2/Day24-Track2.pdf',                                  ft:'pdf',  title:'Day 24',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 24',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d25', day:25, file:'../Track2/Day25-Track2.pdf',                                  ft:'pdf',  title:'Day 25',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 25',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d26', day:26, file:'../Track2/Day26-Track2.pdf',                                  ft:'pdf',  title:'Day 26',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 26',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d27', day:27, file:'../Track2/Day27-Track2.pdf',                                  ft:'pdf',  title:'Day 27',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 27',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
      { id:'t2d28', day:28, file:'../Track2/Day28-Track2.pdf',                                  ft:'pdf',  title:'Day 28',                        instructor:'AICB Faculty', subtitle:'Track 2 - Day 28',             topics:[],                                                   desc:'Nội dung đang được cập nhật.' },
    ]
  },
  track3: {
    id:'track3', label:'Track 3', note:'Agent nâng cao',
    days: [
      { id:'t3d16', day:16, file:'../Track3/Day16-Track3.pdf', ft:'pdf', title:'Advanced Agent Architectures', instructor:'AICB Faculty',     subtitle:'Kiến trúc Agent phức tạp',      topics:['Agent Architecture','Multi-Agent','Planner-Executor'],        desc:'Pattern kiến trúc Agent nâng cao cho enterprise.' },
      { id:'t3d17', day:17, file:'../Track3/Day17-Track3.pdf', ft:'pdf', title:'Memory Systems for Agents',    instructor:'AICB Faculty',     subtitle:'Bộ nhớ ngắn hạn, dài hạn',      topics:['Memory','Short-term','Long-term','Episodic Memory'],          desc:'Thiết kế hệ thống bộ nhớ cho AI agents.' },
      { id:'t3d18', day:18, file:'../Track3/Day18-Track3.pdf', ft:'pdf', title:'Production RAG',               instructor:'Trần Quang Thiện', subtitle:'Từ demo 60% đến production 85%+', topics:['Advanced RAG','Reranking','Hybrid Search','Query Expansion'], desc:'Nâng RAG lên production.' },
      { id:'t3d19', day:19, file:'../Track3/Day19-Track3.pdf', ft:'pdf', title:'GraphRAG & Knowledge Graphs',  instructor:'Ngô Thanh Tùng',   subtitle:'Đồ thị tri thức cho AI',        topics:['GraphRAG','Knowledge Graph','Neo4j','Entity Extraction'],     desc:'Microsoft GraphRAG, Knowledge Graph với Neo4j.' },
      { id:'t3d20', day:20, file:'../Track3/Day20-Track3.pdf', ft:'pdf', title:'Day 20',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 20',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d21', day:21, file:'../Track3/Day21-Track3.pdf', ft:'pdf', title:'Day 21',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 21',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d22', day:22, file:'../Track3/Day22-Track3.pdf', ft:'pdf', title:'Day 22',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 22',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d23', day:23, file:'../Track3/Day23-Track3.pdf', ft:'pdf', title:'Day 23',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 23',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d24', day:24, file:'../Track3/Day24-Track3.pdf', ft:'pdf', title:'Day 24',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 24',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d25', day:25, file:'../Track3/Day25-Track3.pdf', ft:'pdf', title:'Day 25',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 25',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d26', day:26, file:'../Track3/Day26-Track3.pdf', ft:'pdf', title:'Day 26',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 26',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d27', day:27, file:'../Track3/Day27-Track3.pdf', ft:'pdf', title:'Day 27',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 27',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
      { id:'t3d28', day:28, file:'../Track3/Day28-Track3.pdf', ft:'pdf', title:'Day 28',                       instructor:'AICB Faculty',     subtitle:'Track 3 - Day 28',              topics:[],                                                             desc:'Nội dung đang được cập nhật.' },
    ]
  }
};

function allDays() {
  return Object.values(CURRICULUM).flatMap(t => t.days);
}
function findLesson(id) {
  for (const track of Object.values(CURRICULUM)) {
    const day = track.days.find(d => d.id === id);
    if (day) return { ...day, track: track.id };
  }
  return null;
}

// ─── Sidebar ──────────────────────────────────────────────
function renderSidebar() {
  const list = $('sb-list');
  if (!list) return;

  list.innerHTML = Object.values(CURRICULUM).map(track => {
    const done = track.days.filter(d => progress[d.id] === 'done').length;
    const open = currentTrack === track.id;
    return `
      <section class="sb-group ${open ? '' : 'closed'}" data-track="${track.id}">
        <button class="sb-group-hdr" type="button">
          <span class="sb-group-title">
            ${esc(track.label)}
            <span class="sb-group-badge">${done}/${track.days.length}</span>
          </span>
          ${icon('chevron-down', 'ico-sm sb-group-chev')}
        </button>
        <div class="sb-group-items">
          ${track.days.map(day => {
            const st = progress[day.id];
            const state = st === 'done'
              ? `<span class="sb-item-state">${icon('check-circle', 'ico-sm')}</span>`
              : `<span class="sb-item-state"><span class="sb-dot ${st === 'reading' ? 'reading' : ''}"></span></span>`;
            return `
            <button type="button" class="sb-item ${currentLesson?.id === day.id ? 'active' : ''}" data-id="${day.id}">
              <span class="sb-item-badge">D${day.day}</span>
              <span class="sb-item-info">
                <span class="sb-item-title">${esc(day.title)}</span>
                <span class="sb-item-sub">${esc(day.subtitle)}</span>
              </span>
              ${state}
            </button>`;
          }).join('')}
        </div>
      </section>`;
  }).join('');

  list.querySelectorAll('.sb-item').forEach(el =>
    el.addEventListener('click', () => selectLesson(el.dataset.id)));
  list.querySelectorAll('.sb-group-hdr').forEach(hdr =>
    hdr.addEventListener('click', () => hdr.closest('.sb-group').classList.toggle('closed')));
}

// ─── Select lesson ────────────────────────────────────────
function selectLesson(id) {
  const lesson = findLesson(id);
  if (!lesson) return;
  currentLesson = lesson;

  if (App.isWorkOpen()) App.closeWork();

  $('vt-title').textContent = lesson.title;
  $('vt-sub').textContent   = `Day ${lesson.day} · ${lesson.instructor}`;

  const mdBtn = $('mark-done-btn');
  if (mdBtn) {
    mdBtn.classList.remove('hidden');
    const isDone = progress[lesson.id] === 'done';
    $('mark-done-lbl').textContent = isDone ? 'Đã hoàn thành' : 'Đánh dấu xong';
    mdBtn.classList.toggle('is-done', isDone);
  }

  if (lesson.ft === 'pptx') PDFViewer.showPptx(lesson.file, lesson.title);
  else                      PDFViewer.loadPDF(lesson.file, lesson.title);

  AIEngine.setSummaryLesson(lesson);
  AIEngine.setCodeLesson(lesson);
  QuizEngine.setLesson(lesson);
  ScenarioEngine?.setLesson(lesson);
  FlashcardEngine?.setLesson(lesson);
  Chatbot.setLesson(lesson);

  if (!progress[lesson.id] || progress[lesson.id] === 'unread') {
    progress[lesson.id] = 'reading';
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  currentTrack = lesson.track;
  document.querySelectorAll('.track-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.track === lesson.track));

  renderSidebar();
  updateStats();
}

// ─── Track tabs ───────────────────────────────────────────
function setupTrackTabs() {
  document.querySelectorAll('.track-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTrack = btn.dataset.track;
      document.querySelectorAll('.track-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSidebar();
      document.querySelector(`.sb-group[data-track="${currentTrack}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ─── Stats ────────────────────────────────────────────────
function updateStats() {
  const days  = allDays();
  const total = days.length;
  const done  = days.filter(d => progress[d.id] === 'done').length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  $('prog-text').textContent = `${done}/${total} bài`;
  $('prog-fill').style.width = pct + '%';
  $('stat-done').textContent = done;
  $('stat-total').textContent = total;
  $('sb-prog-fill').style.width = pct + '%';

  const all = Object.values(scores).flatMap(s => Object.values(s).map(r => r.pct)).filter(v => typeof v === 'number');
  const avg = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null;
  $('stat-score').textContent = avg !== null ? avg + '%' : '—';
}

// ─── Search ───────────────────────────────────────────────
function setupSearch() {
  $('sb-search')?.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll('.sb-item').forEach(el => {
      el.style.display = !q || el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
    if (q) document.querySelectorAll('.sb-group').forEach(g => g.classList.remove('closed'));
  });
}

// ─── Layout toggles ───────────────────────────────────────
function setupToggles() {
  $('sb-toggle')?.addEventListener('click', function () {
    $('sidebar')?.classList.toggle('closed');
    this.classList.toggle('active', !$('sidebar').classList.contains('closed'));
  });
  $('panel-toggle')?.addEventListener('click', function () {
    $('ai-panel')?.classList.toggle('closed');
    this.classList.toggle('active', !$('ai-panel').classList.contains('closed'));
  });
  // Chế độ tập trung: ẩn/hiện cả hai cột bên trong một thao tác
  $('focus-btn')?.addEventListener('click', function () {
    const sb = $('sidebar'), panel = $('ai-panel');
    const focused = !sb.classList.contains('closed') || !panel.classList.contains('closed');
    sb.classList.toggle('closed', focused);
    panel.classList.toggle('closed', focused);
    this.classList.toggle('on', focused);
    $('sb-toggle')?.classList.toggle('active', !focused);
    $('panel-toggle')?.classList.toggle('active', !focused);
  });

  $('ev-back-btn')?.addEventListener('click', () => App.closeWork());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (App.isWorkOpen()) App.closeWork();
      else $('settings-modal')?.classList.remove('open');
    }
  });
}

// ─── Panel tabs ───────────────────────────────────────────
function setupPanelTabs() {
  document.querySelectorAll('.panel-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });
}

// ─── Mark done ────────────────────────────────────────────
function setupMarkDone() {
  $('mark-done-btn')?.addEventListener('click', () => {
    if (!currentLesson) return;
    const isDone = progress[currentLesson.id] === 'done';
    progress[currentLesson.id] = isDone ? 'reading' : 'done';
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    $('mark-done-lbl').textContent = isDone ? 'Đánh dấu xong' : 'Đã hoàn thành';
    $('mark-done-btn').classList.toggle('is-done', !isDone);
    renderSidebar();
    updateStats();
    if (!isDone) showToast('Đã đánh dấu hoàn thành bài học', 'success');
  });
}

// ─── Settings ─────────────────────────────────────────────
function setupSettings() {
  const modal = $('settings-modal');
  const apiInp = $('api-key-inp'), urlInp = $('base-url-inp');
  const modelSel = $('model-sel'), langSel = $('lang-sel');

  if (apiInp)   apiInp.value   = settings.apiKey || '';
  if (urlInp)   urlInp.value   = settings.baseUrl || 'https://api.shopaikey.com/v1';
  if (modelSel) modelSel.value = settings.model || 'gpt-5.6-luna';
  if (langSel)  langSel.value  = settings.lang || 'mixed';

  $('settings-open-btn')?.addEventListener('click', () => modal?.classList.add('open'));
  $('settings-close-btn')?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  $('settings-save-btn')?.addEventListener('click', () => {
    settings.apiKey  = apiInp?.value.trim() || '';
    settings.baseUrl = urlInp?.value.trim() || 'https://api.shopaikey.com/v1';
    settings.model   = modelSel?.value || 'gpt-5.6-luna';
    settings.lang    = langSel?.value || 'mixed';
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    modal?.classList.remove('open');
    showToast('Đã lưu cài đặt', 'success');
  });

  if (!settings.apiKey) {
    setTimeout(() => {
      modal?.classList.add('open');
      showToast('Nhập API Key để dùng các tính năng AI', 'info');
    }, 700);
  }
}

// ─── Toast ────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const box = $('toasts');
  if (!box) return;
  const name = type === 'success' ? 'check-circle' : type === 'error' ? 'alert' : 'info';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(name, 'ico-sm')}<span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 3200);
}

// ─── Init ─────────────────────────────────────────────────
function init() {
  setupTrackTabs();
  setupSearch();
  setupToggles();
  setupPanelTabs();
  setupMarkDone();
  setupSettings();
  renderSidebar();
  updateStats();

  setTimeout(() => { if (!currentLesson) selectLesson('d1'); }, 150);
}

window.addEventListener('DOMContentLoaded', init);
