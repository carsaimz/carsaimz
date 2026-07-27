#!/usr/bin/env bash
# ============================================================================
# zip-project.sh — Cria um ZIP do projeto pronto para transferir
# Uso: bash scripts/zip-project.sh [nome_customizado]
# ============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
VERSION="$(grep '"version"' "$PROJECT_DIR/package.json" | head -1 | sed 's/.*: *"//;s/".*//')"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

# Nome do ZIP: carsaimz-v0.2.1-20260728-153000.zip
ZIP_NAME="${1:-${PROJECT_NAME}-v${VERSION}-${TIMESTAMP}}"
ZIP_DIR="$PROJECT_DIR/release"
ZIP_FILE="$ZIP_DIR/${ZIP_NAME}.zip"

mkdir -p "$ZIP_DIR"

echo "🧹 Limpando builds anteriores..."
rm -f "$ZIP_DIR"/*.zip

echo "📦 Criando ZIP: ${ZIP_NAME}.zip"
echo "   Versão: ${VERSION}"
echo "   Data:   ${TIMESTAMP}"

# Excluir diretórios grandes/desnecessários
cd "$PROJECT_DIR"

zip -r "$ZIP_FILE" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "out/*" \
  -x "dist/*" \
  -x "build/*" \
  -x "coverage/*" \
  -x ".git/*" \
  -x "release/*" \
  -x "skills/*" \
  -x "db/*.db" \
  -x "db/*.db-journal" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "*.pem" \
  -x ".env*" \
  -x ".vercel/*" \
  -x ".claude/*" \
  -x ".z-ai-config/*" \
  -x "upload/*" \
  -x "download/*" \
  -x "mini-projects/*" \
  -x "worklog.md" \
  -x "local-*" \
  -x "*.tsbuildinfo" \
  -x "next-env.d.ts" \
  -x "test/*" \
  -x "prompt/*"

ZIP_SIZE="$(du -sh "$ZIP_FILE" | cut -f1)"
FILE_COUNT="$(unzip -l "$ZIP_FILE" | tail -1 | awk '{print $2}')"

echo ""
echo "✅ ZIP criado com sucesso!"
echo "   📁 Arquivo: $ZIP_FILE"
echo "   📏 Tamanho: ${ZIP_SIZE}"
echo "   📄 Arquivos: ${FILE_COUNT}"
echo ""
echo "   Para transferir para o Termux:"
echo "   cp $ZIP_FILE /sdcard/Download/"
