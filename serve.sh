#!/bin/bash
# ═══════════════════════════════════════════════════════════
# serve.sh — Local development server for AICB Platform
# Usage: ./serve.sh
# ═══════════════════════════════════════════════════════════

cd "$(dirname "$0")"

PORT=8080

echo ""
echo "  AICB Learning Platform — VinUniversity"
echo "  ---------------------------------------------"
echo "  Server:  http://localhost:$PORT/platform/"
echo "  Dừng:    Ctrl+C"
echo ""

if command -v python3 &>/dev/null; then
    python3 -m http.server $PORT --bind 127.0.0.1
elif command -v python &>/dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "  Lỗi: cần cài Python để chạy server, hoặc dùng: npx serve . -p $PORT"
    exit 1
fi
