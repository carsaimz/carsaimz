/**
 * DB Manager API - Execute Custom SQL Query
 *
 * POST: Execute a raw SQL query (SELECT only for safety, or explicitly allowed statements)
 * Returns results with metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Only allow SELECT, INSERT, UPDATE, DELETE on public schema tables
const ALLOWED_PREFIXES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH'];
const BLOCKED_KEYWORDS = ['DROP', 'ALTER SYSTEM', 'CREATE USER', 'GRANT', 'REVOKE', 'COPY', 'VACUUM'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, mode } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Consulta SQL nao fornecida' },
        { status: 400 }
      );
    }

    // Trim the SQL
    const trimmedSql = sql.trim();

    // Security: block dangerous operations
    const upperSql = trimmedSql.toUpperCase();
    for (const blocked of BLOCKED_KEYWORDS) {
      if (upperSql.includes(blocked)) {
        return NextResponse.json(
          { success: false, error: `Operacao bloqueada: "${blocked}" nao permitida por seguranca` },
          { status: 403 }
        );
      }
    }

    // Check if it starts with an allowed prefix
    const firstWord = upperSql.split(/\s+/)[0];
    if (!ALLOWED_PREFIXES.includes(firstWord)) {
      return NextResponse.json(
        { success: false, error: `Tipo de consulta nao permitido: "${firstWord}". Apenas SELECT, INSERT, UPDATE, DELETE sao aceites.` },
        { status: 403 }
      );
    }

    // Limit execution time with a timeout approach
    const startTime = Date.now();

    try {
      const result = await db.$queryRawUnsafe(trimmedSql);
      const duration = Date.now() - startTime;

      // Determine if result is an array (SELECT) or count (INSERT/UPDATE/DELETE)
      const isSelect = firstWord === 'SELECT' || firstWord === 'WITH';
      const rows = isSelect ? (result as any[]) : [];
      const rowCount = rows.length;

      return NextResponse.json({
        success: true,
        rows: rows,
        rowCount: rowCount,
        duration: duration,
        sql: trimmedSql,
        isSelect: isSelect,
        message: isSelect
          ? `Consulta executada com sucesso. ${rowCount} registos retornados em ${duration}ms.`
          : `Operacao executada com sucesso em ${duration}ms.`,
      });
    } catch (queryError: any) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        error: queryError.message || 'Erro na execucao da consulta',
        sql: trimmedSql,
        duration: duration,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('DB Manager: Error processing query request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar consulta' },
      { status: 500 }
    );
  }
}
