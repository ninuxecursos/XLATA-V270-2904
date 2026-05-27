#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "========================================"
echo "  XLata PDV Offline - Iniciando..."
echo "========================================"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js nao encontrado. Instale em https://nodejs.org/"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install --omit=dev --no-audit --no-fund 2>> start.log
fi

(sleep 2 && (xdg-open http://localhost:3939 2>/dev/null || open http://localhost:3939 2>/dev/null || true)) &
node server.js
