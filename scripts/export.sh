#!/bin/bash
#
# export.sh — Static export for Capacitor (mobile deployment)
#
# Next.js with output: 'export' cannot include:
# 1. API routes (inherently dynamic, can't be statically exported)
# 2. Dynamic [slug] pages without generateStaticParams that returns data
#
# This script temporarily removes both from the app directory,
# runs the static build, then restores everything via cleanup trap.
#
# The Capacitor mobile app handles dynamic pages via client-side routing
# that fetches data from the remote server at runtime.
#
# Usage: ./scripts/export.sh
# Environment: NEXT_EXPORT_MODE=true (set automatically)
#

set -uo pipefail

API_DIR="src/app/api"
BLOG_SLUG_DIR="src/app/(public)/blog/[slug]"
FORUM_SLUG_DIR="src/app/(public)/forum/[slug]"
BACKUP_DIR="/tmp/carsai-export-backup-$$"

# ── Cleanup trap: always restore all moved directories ──
cleanup() {
  local restored=0
  if [ -d "$BACKUP_DIR/api" ]; then
    echo "📦 Restaurando API routes..."
    mkdir -p "$API_DIR"
    cp -r "$BACKUP_DIR/api/"* "$API_DIR/" 2>/dev/null || true
    rm -rf "$BACKUP_DIR/api"
    restored=1
  fi
  if [ -d "$BACKUP_DIR/blog-slug" ]; then
    echo "📦 Restaurando blog/[slug]..."
    mkdir -p "$BLOG_SLUG_DIR"
    cp -r "$BACKUP_DIR/blog-slug/"* "$BLOG_SLUG_DIR/" 2>/dev/null || true
    rm -rf "$BACKUP_DIR/blog-slug"
    restored=1
  fi
  if [ -d "$BACKUP_DIR/forum-slug" ]; then
    echo "📦 Restaurando forum/[slug]..."
    mkdir -p "$FORUM_SLUG_DIR"
    cp -r "$BACKUP_DIR/forum-slug/"* "$FORUM_SLUG_DIR/" 2>/dev/null || true
    rm -rf "$BACKUP_DIR/forum-slug"
    restored=1
  fi
  if [ "$restored" -eq 1 ]; then
    echo "   ✓ Todos os ficheiros restaurados com sucesso"
  fi
  rm -rf "$BACKUP_DIR"
}
trap cleanup EXIT

echo "🚀 Carsai Mozambique — Exportacao Statica (Capacitor)"
echo ""

# ── Step 1: Backup dynamic content ──
mkdir -p "$BACKUP_DIR"

if [ -d "$API_DIR" ]; then
  echo "📦 Movendo API routes..."
  cp -r "$API_DIR" "$BACKUP_DIR/api"
  rm -rf "$API_DIR"
fi

if [ -d "$BLOG_SLUG_DIR" ]; then
  echo "📦 Movendo blog/[slug]..."
  cp -r "$BLOG_SLUG_DIR" "$BACKUP_DIR/blog-slug"
  rm -rf "$BLOG_SLUG_DIR"
fi

if [ -d "$FORUM_SLUG_DIR" ]; then
  echo "📦 Movendo forum/[slug]..."
  cp -r "$FORUM_SLUG_DIR" "$BACKUP_DIR/forum-slug"
  rm -rf "$FORUM_SLUG_DIR"
fi

echo "   ✓ Ficheiros movidos para backup temporario"

# ── Step 2: Clean output ──
echo ""
echo "🧹 Limpando diretorio out..."
rm -rf out

# ── Step 3: Run static export ──
echo ""
echo "⚙️  Compilando Next.js (modo exportacao statica)..."
NEXT_EXPORT_MODE=true bunx next build
EXPORT_STATUS=$?

# ── Step 4: Report ──
echo ""
if [ $EXPORT_STATUS -eq 0 ]; then
  echo "✅ Exportacao concluida com sucesso!"
  echo "   Diretorio: out/"
  echo "   Ficheiros: $(find out -type f | wc -l)"
  echo ""
  echo "📱 Proximo passo: bunx cap sync android"
else
  echo "❌ Exportacao falhou (codigo: $EXPORT_STATUS)"
  echo "   Ficheiros serao restaurados automaticamente."
  exit $EXPORT_STATUS
fi
