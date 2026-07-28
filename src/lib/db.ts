/**
 * Carsai Mozambique - Database Client
 *
 * Prisma with PostgreSQL (Supabase) as the primary database.
 * All CRUD operations use Prisma connected to Supabase via DATABASE_URL.
 */

import { PrismaClient } from '@prisma/client'

// ──────────────────────────────────────────────
// Prisma client (PostgreSQL / Supabase)
// ──────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
