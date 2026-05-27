#!/usr/bin/env bash
# Build offline template: roda vite build, monta template completo a partir de
# scripts/offline-template/ + dist-offline gerado, instala node_modules e zipa.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE_SRC="${ROOT}/scripts/offline-template"
TEMPLATE_DIR="/tmp/xlata-pdv-offline"
ZIP_OUT="${ROOT}/public/downloads/xlata-pdv-offline-template.zip"

cd "$ROOT"

echo "==> Building React offline bundle..."
npx vite build --config vite.config.offline.ts

echo "==> Recriando template em ${TEMPLATE_DIR}..."
rm -rf "${TEMPLATE_DIR}"
mkdir -p "${TEMPLATE_DIR}"

# Copia arquivos versionados do template (server.js, package.json, README, license, credentials, public/, start.sh)
cp -r "${TEMPLATE_SRC}/." "${TEMPLATE_DIR}/"

echo "==> Copiando dist-offline para template/dist (excluindo /downloads para evitar recursão)..."
rm -rf "${TEMPLATE_DIR}/dist"
cp -r "${ROOT}/dist-offline" "${TEMPLATE_DIR}/dist"
# CRÍTICO: remover downloads/ do dist empacotado — public/downloads contém o
# próprio template offline, o que causaria recursão e zip de >180MB.
rm -rf "${TEMPLATE_DIR}/dist/downloads"

echo "==> Pulando instalação de node_modules (será feita pelo start.bat na primeira execução do cliente)..."
# IMPORTANTE: NÃO empacotar node_modules — o zip ficaria >150MB e o servidor de
# preview/CDN não consegue servir. O start.bat roda 'npm install --omit=dev'
# automaticamente na primeira execução do cliente.
cd "$TEMPLATE_DIR"
rm -rf node_modules

echo "==> Normalizando start.bat (CRLF para Windows)..."
cp "${ROOT}/scripts/start.bat.template" "${TEMPLATE_DIR}/start.bat"
sed -i 's/\r$//' "${TEMPLATE_DIR}/start.bat"
sed -i 's/$/\r/' "${TEMPLATE_DIR}/start.bat"
if ! head -1 "${TEMPLATE_DIR}/start.bat" | grep -q $'\r$'; then
  echo "❌ start.bat is NOT CRLF! Aborting."
  exit 1
fi
echo "   start.bat OK (CRLF verificado)"

echo "==> Zipando..."
mkdir -p "$(dirname "$ZIP_OUT")"
rm -f "$ZIP_OUT"
cd /tmp
zip -r -q "$ZIP_OUT" xlata-pdv-offline -x "*.DS_Store"

ls -lh "$ZIP_OUT"
echo "✅ Done: $ZIP_OUT"
