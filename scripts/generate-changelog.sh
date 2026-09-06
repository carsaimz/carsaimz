#!/bin/bash
#
# generate-changelog.sh
# Gera um registo de alteracoes (changelog) a partir de mensagens de commit git entre duas tags.
# Toda a saída é em portugues (pt-pt).
#
# Uso: ./scripts/generate-changelog.sh [TAG_ANTerior] [TAG_ACTUAL]
#
# Se nenhuma tag for fornecida, usa as duas ultimas tags automaticamente.
# Se apenas uma tag for fornecida, usa o primeiro commit como base.
#

set -euo pipefail

PREVIOUS_TAG="${1:-}"
CURRENT_TAG="${2:-}"

# Detectar tags automaticamente se nao fornecidas
if [ -z "$CURRENT_TAG" ]; then
  CURRENT_TAG=$(git tag --sort=-version:refname | head -1)
  if [ -z "$CURRENT_TAG" ]; then
    echo "Nenhuma tag git encontrada. Crie uma tag primeiro: git tag v0.1.0"
    exit 1
  fi
fi

if [ -z "$PREVIOUS_TAG" ]; then
  PREVIOUS_TAG=$(git tag --sort=-version:refname | grep -v "^${CURRENT_TAG}$" | head -1)
fi

# Determinar o intervalo de commits
if [ -n "$PREVIOUS_TAG" ]; then
  COMMIT_RANGE="${PREVIOUS_TAG}..${CURRENT_TAG}"
  RANGE_LABEL="${PREVIOUS_TAG} -> ${CURRENT_TAG}"
else
  COMMIT_RANGE="${CURRENT_TAG}"
  RANGE_LABEL="Inicial -> ${CURRENT_TAG}"
fi

echo "# Registo de Alteracoes"
echo ""
echo "## ${CURRENT_TAG} ($(date +%Y-%m-%d))"
echo ""
echo "### Alteracoes (${RANGE_LABEL})"
echo ""

# Categorizar commits
FEATURE_COMMITS=""
BUGFIX_COMMITS=""
OTHER_COMMITS=""

while IFS= read -r commit; do
  if [ -z "$commit" ]; then continue; fi

  # Extrair o assunto do commit (primeira linha)
  subject=$(echo "$commit" | head -1)

  # Categorizar baseado em prefixos de conventional commit
  if echo "$subject" | grep -qiE '^(feat|feature|add|\+)'; then
    FEATURE_COMMITS="${FEATURE_COMMITS}- ${subject}\n"
  elif echo "$subject" | grep -qiE '^(fix|bugfix|patch|hotfix|\-)'; then
    BUGFIX_COMMITS="${BUGFIX_COMMITS}- ${subject}\n"
  else
    OTHER_COMMITS="${OTHER_COMMITS}- ${subject}\n"
  fi
done < <(git log --format="%s" "$COMMIT_RANGE" 2>/dev/null || echo "")

# Saida categorizada em portugues
if [ -n "$FEATURE_COMMITS" ]; then
  echo "### Novas Funcionalidades"
  echo ""
  echo -e "$FEATURE_COMMITS"
fi

if [ -n "$BUGFIX_COMMITS" ]; then
  echo "### Correcoes de Erros"
  echo ""
  echo -e "$BUGFIX_COMMITS"
fi

if [ -n "$OTHER_COMMITS" ]; then
  echo "### Outras Alteracoes"
  echo ""
  echo -e "$OTHER_COMMITS"
fi

# Informacao de contribuidores
echo ""
echo "### Contribuidores"
echo ""
git log --format="- @%an" "$COMMIT_RANGE" 2>/dev/null | sort -u | head -20 || echo "- N/A"
echo ""

# Estatisticas
echo "### Estatisticas"
echo ""
TOTAL_COMMITS=$(git log --oneline "$COMMIT_RANGE" 2>/dev/null | wc -l || echo "0")
TOTAL_FILES=$(git diff --stat "$COMMIT_RANGE" 2>/dev/null | tail -1 || echo "N/A")
echo "- Total de commits: ${TOTAL_COMMITS}"
echo "- Ficheiros alterados: ${TOTAL_FILES}"
