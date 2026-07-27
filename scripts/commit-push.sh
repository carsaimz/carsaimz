#!/usr/bin/env bash
# ============================================================================
# commit-push.sh — Commit + Push para GitHub (usar no Termux)
# Uso: bash scripts/commit-push.sh "mensagem do commit"
#      bash scripts/commit-push.sh              (mensagem automática)
# ============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# ── Cores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Verificar se é um repositório git ──────────────────────────────────────
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Não é um repositório git!${NC}"
  exit 1
fi

# ── Verificar remote ──────────────────────────────────────────────────────
REMOTE_URL="$(git remote get-url origin 2>/dev/null || echo '')"
if [ -z "$REMOTE_URL" ]; then
  echo -e "${YELLOW}⚠️  Nenhum remote 'origin' configurado.${NC}"
  echo -e "${CYAN}   Configure com:${NC}"
  echo "   git remote add origin https://github.com/carsaimz/carsaimz.git"
  exit 1
fi

echo -e "${CYAN}🌐 Remote: ${REMOTE_URL}${NC}"

# ── Verificar se há token no remote URL ────────────────────────────────────
has_token() {
  echo "$REMOTE_URL" | grep -q "https://[a-zA-Z0-9_]*@" 2>/dev/null
}

if ! has_token; then
  echo -e "${YELLOW}⚠️  Nenhum PAT detectado na URL do remote.${NC}"
  echo -e "${CYAN}   Para configurar, execute:${NC}"
  echo ""
  echo "   git remote set-url origin https://<SEU_TOKEN>@github.com/carsaimz/carsaimz.git"
  echo ""
  echo -e "${CYAN}   Substitua <SEU_TOKEN> pelo seu GitHub Personal Access Token.${NC}"
  echo -e "${CYAN}   Crie um em: https://github.com/settings/tokens${NC}"
  echo ""
  read -rp "   Deseja configurar o token agora? [s/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -rp "   Cole seu PAT: " TOKEN
    if [ -n "$TOKEN" ]; then
      git remote set-url origin "https://${TOKEN}@github.com/carsaimz/carsaimz.git"
      REMOTE_URL="$(git remote get-url origin)"
      echo -e "${GREEN}✅ Token configurado!${NC}"
    else
      echo -e "${RED}❌ Token vazio. Saindo.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}   Continuando sem token (push pode falhar)...${NC}"
  fi
fi

# ── Status ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}📋 Status do repositório:${NC}"
git status --short

STAGED="$(git diff --cached --name-only 2>/dev/null)"
UNSTAGED="$(git diff --name-only 2>/dev/null)"
UNTRACKED="$(git ls-files --others --exclude-standard 2>/dev/null)"

if [ -z "$STAGED" ] && [ -z "$UNSTAGED" ] && [ -z "$UNTRACKED" ]; then
  echo -e "${GREEN}✅ Nenhuma alteração pendente. Tudo limpo!${NC}"
  
  # Verificar se há commits não enviados
  UNPUSHED="$(git log origin/main..HEAD --oneline 2>/dev/null || echo '')"
  if [ -n "$UNPUSHED" ]; then
    echo ""
    echo -e "${YELLOW}📤 Commits não enviados:${NC}"
    echo "$UNPUSHED"
    echo ""
    read -rp "   Deseja fazer push agora? [s/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      echo -e "${CYAN}🚀 Fazendo push...${NC}"
      git push -u origin main
      echo -e "${GREEN}✅ Push concluído!${NC}"
    fi
  fi
  exit 0
fi

# ── Adicionar arquivos ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}➕ Adicionando arquivos...${NC}"
git add -A

# ── Commit ─────────────────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  COMMIT_MSG="$1"
else
  # Gerar mensagem automática com timestamp e resumo
  CHANGED_COUNT="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
  COMMIT_MSG="update: ${CHANGED_COUNT} files changed (${TIMESTAMP})"
fi

echo -e "${CYAN}💾 Commit: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG"

# ── Push ───────────────────────────────────────────────────────────────────
echo ""
read -rp "🚀 Fazer push para origin/main? [s/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${CYAN}🚀 Fazendo push...${NC}"
  git push -u origin main
  echo -e "${GREEN}✅ Push concluído!${NC}"
else
  echo -e "${YELLOW}⏸️  Commit local feito. Push adiado.${NC}"
  echo -e "${CYAN}   Para push manual: git push -u origin main${NC}"
fi

# ── Resumo ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}📊 Últimos commits:${NC}"
git log --oneline -5
