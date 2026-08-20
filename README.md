# AICB Learning Platform — VinUniversity 2026

Nền tảng học tập tĩnh cho khóa **AICB (AI in Coding & Business)**: xem slide bài giảng và
học cùng trợ lý AI (tóm tắt, trắc nghiệm, tự luận, thẻ ghi nhớ, bài tập code).

## Chạy cục bộ

```bash
./serve.sh          # http://localhost:8080/platform/
```

Cần chạy qua HTTP server (không mở trực tiếp file://) vì PDF.js dùng fetch để tải slide.

## API Key

Nền tảng gọi endpoint tương thích OpenAI **trực tiếp từ trình duyệt**. Mỗi người dùng tự
nhập API Key của mình trong phần Cài đặt; key được lưu trong `localStorage` của chính máy
người đó và **không** được commit hay gửi về server nào của dự án.

Vào **Cài đặt** để cấu hình Base URL, model và ngôn ngữ phản hồi.

## Cấu trúc

```
index.html          chuyển hướng tới /platform/
platform/           ứng dụng (HTML + CSS + JS thuần, không build step)
  css/style.css     design system
  js/               pdfViewer, aiEngine, quizEngine, scenarioEngine,
                    flashcardEngine, chatbot, app
Slide/              slide Phase 1 (PDF)
Track2/ Track3/     slide theo track
```

## Deploy

Site tĩnh thuần, không cần build. Thư mục gốc chính là thư mục publish.

- **GitHub Pages** — Settings → Pages → Deploy from branch `main` / `root`
- **Vercel** — Import repo, Framework Preset: *Other*, Build Command: để trống,
  Output Directory: `.`
- **Netlify / Cloudflare Pages** — publish directory `.`, không có build command
