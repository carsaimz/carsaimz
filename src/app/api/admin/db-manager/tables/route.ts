/**
 * DB Manager API - List Tables
 *
 * Returns all tables in the Supabase PostgreSQL database with their
 * row counts, column info, and size information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all user tables with row counts and sizes
    const tables = await db.$queryRaw<{
      table_name: string;
      row_count: bigint;
      total_size: bigint;
      index_size: bigint;
    }[]>`
      SELECT
        c.relname AS table_name,
        COALESCE(r.n_live_tup, 0) AS row_count,
        COALESCE(pg_total_relation_size(c.oid), 0) AS total_size,
        COALESCE(pg_indexes_size(c.oid), 0) AS index_size
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables r ON r.relname = c.relname AND r.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname NOT LIKE '_prisma_migrations%'
      ORDER BY c.relname
    `;

    // Get column details for all tables
    const columns = await db.$queryRaw<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      character_maximum_length: number | null;
      is_primary_key: boolean;
    }[]>`
      SELECT
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT ku.column_name, ku.table_name, ku.table_schema
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.column_name = c.column_name AND pk.table_name = c.table_name AND pk.table_schema = c.table_schema
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE '_prisma_migrations%'
      ORDER BY t.table_name, c.ordinal_position
    `;

    // Group columns by table
    const tablesWithColumns = tables.map(table => {
      const tableColumns = columns.filter(col => col.table_name === table.table_name);
      return {
        name: table.table_name,
        rowCount: Number(table.row_count),
        totalSize: Number(table.total_size),
        indexSize: Number(table.index_size),
        columns: tableColumns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          maxLength: col.character_maximum_length,
          isPrimaryKey: col.is_primary_key,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      tables: tablesWithColumns,
      totalTables: tablesWithColumns.length,
    });
  } catch (error: any) {
    console.error('DB Manager: Error listing tables:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar tabelas' },
      { status: 500 }
    );
  }
}
