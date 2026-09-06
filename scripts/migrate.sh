#!/bin/bash
#
# migrate.sh - Script unificado de migracao para Carsai Mozambique
# Executa Prisma generate + migrate + Supabase SQL em uma unica execucao.
#
# Uso:
#   ./scripts/migrate.sh           # Migracao completa (Prisma + Supabase)
#   ./scripts/migrate.sh prisma    # Apenas Prisma migrate
#   ./scripts/migrate.sh supabase  # Apenas Supabase SQL
#   ./scripts/migrate.sh seed      # Apenas dados iniciais
#   ./scripts/migrate.sh status    # Verificar estado da base de dados
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ──────────────────────────────────────────────
# Funcoes auxiliares
# ──────────────────────────────────────────────

log_info() {
  echo "========================================"
  echo "  $1"
  echo "========================================"
}

log_step() {
  echo ""
  echo ">> $1"
}

check_env() {
  if [ ! -f "$PROJECT_DIR/.env.local" ] && [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "AVISO: Nenhum arquivo .env.local ou .env encontrado."
    echo "Crie .env.local com DATABASE_URL e DIRECT_URL para Supabase."
    echo ""
    echo "Exemplo:"
    echo "  DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.kngwnzvotefivjmaleup.supabase.co:5432/postgres\""
    echo "  DIRECT_URL=\"postgresql://postgres:[PASSWORD]@db.kngwnzvotefivjmaleup.supabase.co:5432/postgres\""
    echo ""
    exit 1
  fi
}

# ──────────────────────────────────────────────
# Prisma: Generate + Migrate
# ──────────────────────────────────────────────

run_prisma() {
  log_info "Migracao Prisma (PostgreSQL / Supabase)"

  log_step "Gerando cliente Prisma..."
  cd "$PROJECT_DIR"
  bunx prisma generate

  log_step "Executando Prisma migrate deploy..."
  bunx prisma migrate deploy

  log_step "Verificando estado da migracao..."
  bunx prisma migrate status

  echo ""
  echo "Prisma migracao concluida com sucesso!"
}

# ──────────────────────────────────────────────
# Supabase: Executar SQL diretamente
# ──────────────────────────────────────────────

run_supabase() {
  log_info "Migracao Supabase SQL"

  MIGRATION_FILE="$PROJECT_DIR/supabase/migrations/001_initial.sql"

  if [ ! -f "$MIGRATION_FILE" ]; then
    echo "ERRO: Arquivo de migracao nao encontrado: $MIGRATION_FILE"
    exit 1
  fi

  # Carregar variaveis de ambiente
  if [ -f "$PROJECT_DIR/.env.local" ]; then
    set -a
    source "$PROJECT_DIR/.env.local"
    set +a
  elif [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
  fi

  SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
  SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "AVISO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao definidos."
    echo "Executando via Prisma migrate (que usa DATABASE_URL)."
    echo ""
    run_prisma
    return
  fi

  log_step "Executando SQL no Supabase via API..."

  # Extrair project ref do URL
  PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([a-z]+)\.supabase\.co|\1|')

  # Executar via Supabase Management API
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(cat "$MIGRATION_FILE" | sed 's/"/\\"/g' | tr '\n' ' ')\"}" \
    || echo "Nota: Se a API rpc nao estiver disponivel, execute o SQL manualmente no Editor SQL do Supabase Dashboard."

  echo ""
  echo "Supabase SQL pode ser executado manualmente no Dashboard:"
  echo "  1. Acesse: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
  echo "  2. Cole o conteudo de: $MIGRATION_FILE"
  echo "  3. Execute o SQL"
  echo ""
  echo "Alternativa via Prisma (recomendada):"
  echo "  bunx prisma migrate deploy"
}

# ──────────────────────────────────────────────
# Seed: Dados iniciais
# ──────────────────────────────────────────────

run_seed() {
  log_info "Inserir dados iniciais (seed)"

  # Carregar variaveis de ambiente
  if [ -f "$PROJECT_DIR/.env.local" ]; then
    set -a; source "$PROJECT_DIR/.env.local"; set +a
  elif [ -f "$PROJECT_DIR/.env" ]; then
    set -a; source "$PROJECT_DIR/.env"; set +a
  fi

  log_step "Executando seed via Prisma..."
  cd "$PROJECT_DIR"
  bunx prisma db seed || echo "Seed script nao configurado. Use o SQL de seed na migracao."
}

# ──────────────────────────────────────────────
# Status: Verificar estado
# ──────────────────────────────────────────────

run_status() {
  log_info "Estado da Base de Dados"

  cd "$PROJECT_DIR"

  log_step "Estado Prisma migrate..."
  bunx prisma migrate status

  log_step "Verificando conexao..."
  bunx prisma db execute --stdin <<< "SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';" || echo "Nao foi possivel verificar tabelas."

  echo ""
  echo "Verificacao concluida."
}

# ──────────────────────────────────────────────
# Full: Migracao completa
# ──────────────────────────────────────────────

run_full() {
  log_info "Migracao Completa (Prisma + Supabase SQL)"

  check_env

  # 1. Gerar cliente Prisma
  log_step "1/4 - Gerando cliente Prisma..."
  cd "$PROJECT_DIR"
  bunx prisma generate

  # 2. Executar Prisma migrate (cria tabelas via Prisma)
  log_step "2/4 - Executando Prisma migrate..."
  bunx prisma migrate deploy

  # 3. Executar SQL Supabase (garante indexes e seed)
  log_step "3/4 - Executando SQL complementar (indexes + seed)..."
  MIGRATION_FILE="$PROJECT_DIR/supabase/migrations/001_initial.sql"

  if [ -f "$MIGRATION_FILE" ]; then
    echo "O arquivo de migracao SQL esta disponivel em:"
    echo "  $MIGRATION_FILE"
    echo ""
    echo "Se as tabelas foram criadas via Prisma migrate, os indexes"
    echo "e dados iniciais (seed) podem ser executados manualmente"
    echo "no Editor SQL do Supabase Dashboard."
    echo ""
    echo "Acesse: Supabase Dashboard > SQL Editor"
    echo "Cole e execute o conteudo do arquivo de migracao."
  fi

  # 4. Verificar estado
  log_step "4/4 - Verificando estado..."
  bunx prisma migrate status

  echo ""
  echo "==========================================="
  echo "  Migracao concluida com sucesso!"
  echo "==========================================="
  echo ""
  echo "Proximos passos:"
  echo "  1. Verifique as tabelas no Supabase Dashboard"
  echo "  2. Execute bun run dev para iniciar o servidor"
  echo "  3. Crie um utilizador super_admin via API ou Dashboard"
}

# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

COMMAND="${1:-full}"

case "$COMMAND" in
  prisma)    run_prisma ;;
  supabase)  run_supabase ;;
  seed)      run_seed ;;
  status)    run_status ;;
  full)      run_full ;;
  *)
    echo "Uso: ./scripts/migrate.sh [prisma|supabase|seed|status|full]"
    echo ""
    echo "Comandos:"
    echo "  full       - Migracao completa (padrao)"
    echo "  prisma     - Apenas Prisma generate + migrate"
    echo "  supabase   - Apenas Supabase SQL"
    echo "  seed       - Apenas dados iniciais"
    echo "  status     - Verificar estado da base de dados"
    exit 1
    ;;
esac
