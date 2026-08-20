// ═══════════════════════════════════════════════════════════
// pdfViewer.js v3 — PDF.js wrapper
//  · HiDPI (devicePixelRatio) rendering  → slide sắc nét, không bị vỡ
//  · Fit-to-frame mặc định               → slide chiếm trọn khung xem
//  · Zoom, phím tắt, trình chiếu toàn màn hình
// ═══════════════════════════════════════════════════════════

const PDFViewer = (() => {
  const STAGE_PAD  = 40;   // matches #viewer-stage padding (20px * 2)
  const MAX_DPR    = 2.5;  // cap để tránh canvas quá lớn
  const MAX_PIXELS = 16e6; // giới hạn an toàn cho canvas

  let pdfDoc      = null;
  let currentPage = 1;
  let totalPages  = 0;
  let zoomLevel   = 1.0;    // hệ số nhân trên mức "vừa khung"
  let fitMode     = true;   // true = tự vừa khung, false = zoom thủ công
  let isRendering = false;
  let pendingPage = null;

  const $ = id => document.getElementById(id);
  const canvas  = () => $('pdf-canvas');
  const stage   = () => $('viewer-stage');
  const holder  = () => $('viewer-placeholder');
  const loader  = () => $('viewer-loading');
  const pptxBox = () => $('pptx-viewer');

  // ─── Visibility ─────────────────────────────────────────
  function hideAll() {
    if (stage())   stage().style.display = 'none';
    if (holder())  holder().style.display = 'none';
    pptxBox()?.classList.remove('on');
  }
  function showLoading(msg) {
    if ($('spin-text')) $('spin-text').textContent = msg || 'Đang tải…';
    hideAll();
    loader()?.classList.add('on');
  }
  function showStage() {
    loader()?.classList.remove('on');
    hideAll();
    if (stage()) stage().style.display = 'flex';
  }
  function showPlaceholder() {
    loader()?.classList.remove('on');
    hideAll();
    if (holder()) holder().style.display = 'flex';
    pdfDoc = null; totalPages = 0; currentPage = 1;
    updateNav(false);
  }
  function showPptx(url, title) {
    loader()?.classList.remove('on');
    hideAll();
    pdfDoc = null; totalPages = 0;
    if ($('pptx-title')) $('pptx-title').textContent = title || 'Bài giảng PowerPoint';
    if ($('pptx-dl'))    $('pptx-dl').href = url;
    pptxBox()?.classList.add('on');
    updateNav(false);
  }

  // ─── Toolbar state ──────────────────────────────────────
  function updateNav(hasPdf) {
    const prev = $('pdf-prev'), next = $('pdf-next');
    if (prev) prev.disabled = !hasPdf || currentPage <= 1;
    if (next) next.disabled = !hasPdf || currentPage >= totalPages;
    if ($('pdf-total')) $('pdf-total').textContent = hasPdf ? totalPages : '—';
    if ($('pdf-pg'))  { $('pdf-pg').value = currentPage; $('pdf-pg').max = totalPages || 1; }
    ['zoom-in','zoom-out','zoom-fit','present-btn'].forEach(id => {
      if ($(id)) $(id).disabled = !hasPdf;
    });
    updateZoomLabel();
  }
  function updateZoomLabel() {
    if ($('zoom-lbl')) $('zoom-lbl').textContent = Math.round(zoomLevel * 100) + '%';
    $('zoom-fit')?.classList.toggle('on', fitMode);
  }

  // ─── Render ─────────────────────────────────────────────
  async function renderPage(num) {
    if (!pdfDoc) return;
    if (isRendering) { pendingPage = num; return; }
    isRendering = true;

    try {
      const page     = await pdfDoc.getPage(num);
      const stageEl  = stage();
      const isFs     = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const pad      = isFs ? 0 : STAGE_PAD;

      const availW = Math.max((stageEl?.clientWidth  || 900) - pad, 200);
      const availH = Math.max((stageEl?.clientHeight || 600) - pad, 200);

      const base = page.getViewport({ scale: 1 });

      // "Vừa khung": slide hiển thị trọn vẹn và lớn nhất có thể trong khung xem
      const fitScale = Math.min(availW / base.width, availH / base.height);
      const cssScale = fitScale * zoomLevel;

      // Render ở độ phân giải vật lý của màn hình → không bị mờ/vỡ
      let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cssW = cssScale * base.width, cssH = cssScale * base.height;
      while (dpr > 1 && cssW * dpr * cssH * dpr > MAX_PIXELS) dpr -= 0.5;

      const vp  = page.getViewport({ scale: cssScale * dpr });
      const cvs = canvas();
      if (!cvs) return;

      cvs.width  = Math.floor(vp.width);
      cvs.height = Math.floor(vp.height);
      cvs.style.width  = Math.floor(vp.width  / dpr) + 'px';
      cvs.style.height = Math.floor(vp.height / dpr) + 'px';

      const ctx = cvs.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      currentPage = num;
      // Chỉ cho phép cuộn khi người dùng phóng to vượt khung
      stageEl?.classList.toggle('zoomed', zoomLevel > 1.001);
      showStage();
      updateNav(true);
      if (stageEl) { stageEl.scrollTop = 0; stageEl.scrollLeft = 0; }
    } catch (e) {
      console.error('Render error:', e);
      App?.toast?.('Không render được trang slide', 'error');
    } finally {
      isRendering = false;
      if (pendingPage !== null && pendingPage !== currentPage) {
        const p = pendingPage; pendingPage = null; renderPage(p);
      } else {
        pendingPage = null;
      }
    }
  }

  function rerender() { if (pdfDoc) renderPage(currentPage); }

  // ─── Load ───────────────────────────────────────────────
  async function loadPDF(url, title) {
    pdfDoc = null; currentPage = 1; totalPages = 0;
    zoomLevel = 1.0; fitMode = true;
    showLoading('Đang tải ' + (title || 'slide') + '…');

    try {
      const task = pdfjsLib.getDocument(url);
      task.onProgress = ({ loaded, total }) => {
        if (total && $('spin-text')) {
          $('spin-text').textContent = `Đang tải… ${Math.round(loaded / total * 100)}%`;
        }
      };
      pdfDoc = await task.promise;
      totalPages = pdfDoc.numPages;
      await renderPage(1);
    } catch (e) {
      console.error('PDF load error:', e);
      showPlaceholder();
      App?.toast?.('Không tải được slide. Hãy chạy ./serve.sh và mở qua localhost.', 'error');
    }
  }

  // ─── Zoom ───────────────────────────────────────────────
  function setZoom(v) {
    zoomLevel = Math.min(Math.max(v, 0.5), 4);
    fitMode = Math.abs(zoomLevel - 1) < 0.001;
    updateZoomLabel();
    rerender();
  }

  // ─── Fullscreen presentation ────────────────────────────
  function togglePresent() {
    const el = stage();
    if (!el || !pdfDoc) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  }

  // ─── Events ─────────────────────────────────────────────
  function setupEvents() {
    $('pdf-prev')?.addEventListener('click', () => currentPage > 1 && renderPage(currentPage - 1));
    $('pdf-next')?.addEventListener('click', () => currentPage < totalPages && renderPage(currentPage + 1));
    $('pdf-pg')?.addEventListener('change', e => {
      const n = parseInt(e.target.value, 10);
      if (n >= 1 && n <= totalPages) renderPage(n);
      else e.target.value = currentPage;
    });

    $('zoom-in') ?.addEventListener('click', () => setZoom(zoomLevel + 0.15));
    $('zoom-out')?.addEventListener('click', () => setZoom(zoomLevel - 0.15));
    $('zoom-fit')?.addEventListener('click', () => setZoom(1.0));
    $('present-btn')?.addEventListener('click', togglePresent);

    document.addEventListener('keydown', e => {
      if (document.getElementById('exercise-view')?.classList.contains('open')) return;
      if (e.target.matches('input,textarea,select')) return;
      if (!pdfDoc) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (currentPage < totalPages) { e.preventDefault(); renderPage(currentPage + 1); }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 1) { e.preventDefault(); renderPage(currentPage - 1); }
      } else if (e.key === 'Home') { e.preventDefault(); renderPage(1); }
      else if (e.key === 'End')    { e.preventDefault(); renderPage(totalPages); }
      else if (e.key === 'f' || e.key === 'F') togglePresent();
    });

    stage()?.addEventListener('wheel', e => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(zoomLevel + (e.deltaY < 0 ? 0.1 : -0.1));
    }, { passive: false });

    let resizeTimer;
    const scheduleRerender = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rerender, 180);
    };
    window.addEventListener('resize', scheduleRerender);
    document.addEventListener('fullscreenchange', scheduleRerender);
    document.addEventListener('webkitfullscreenchange', scheduleRerender);

    // Panel/sidebar toggles đổi bề rộng khung xem → render lại cho vừa khung
    if (window.ResizeObserver && stage()) {
      let lastW = 0, lastH = 0;
      const ro = new ResizeObserver(entries => {
        const r = entries[0].contentRect;
        if (Math.abs(r.width - lastW) < 4 && Math.abs(r.height - lastH) < 4) return;
        lastW = r.width; lastH = r.height;
        scheduleRerender();
      });
      ro.observe(stage());
    }
  }

  setupEvents();
  showPlaceholder();

  return { loadPDF, showPlaceholder, showPptx, rerender, hasPDF: () => !!pdfDoc };
})();

window.PDFViewer = PDFViewer;
