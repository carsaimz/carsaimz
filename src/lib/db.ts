/**
 * Carsai Mozambique - Database Client
 *
 * Prisma with MySQL as the primary database.
 * All CRUD operations use Prisma connected to MySQL via DATABASE_URL.
 */

import { PrismaClient } from '@prisma/client'

// ──────────────────────────────────────────────
// Prisma client (MySQL)
// ──────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
