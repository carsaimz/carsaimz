/**
 * Carsai Mozambique - Database Client
 *
 * This module provides a unified database client that uses:
 * - Prisma (SQLite) as the primary local database for development
 * - Supabase REST API as a future option when tables are created in Supabase
 *
 * The Supabase integration is available via the `supabaseAdmin` client
 * from src/lib/supabase.ts for direct queries or future migration.
 *
 * For now, all CRUD operations use Prisma/SQLite which is working reliably.
 * When Supabase tables are created (via the SQL migration file), we can
 * gradually switch operations to use Supabase REST API instead.
 */

import { PrismaClient } from '@prisma/client'

// ──────────────────────────────────────────────
// Prisma client (SQLite for local dev)
// ──────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
