/**
 * DB Manager API - Table Data (Browse + CRUD)
 *
 * GET: Browse table rows with pagination, filtering, sorting
 * POST: Insert a new row
 * PUT: Update an existing row
 * DELETE: Delete a row by primary key
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── GET: Browse table data ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = searchParams.get('sortOrder') || 'ASC';
    const filterCol = searchParams.get('filterCol') || '';
    const filterVal = searchParams.get('filterVal') || '';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * pageSize;

    // Validate table exists
    const tableCheck = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${name}
      ) AS exists
    `;

    if (!tableCheck[0]?.exists) {
      return NextResponse.json(
        { success: false, error: `Tabela "${name}" nao encontrada` },
        { status: 404 }
      );
    }

    // Get column info for this table
    const columns = await db.$queryRaw<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      character_maximum_length: number | null;
      is_primary_key: boolean;
    }[]>`
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name, ku.table_name, ku.table_schema
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND ku.table_name = ${name}
      ) pk ON pk.column_name = c.column_name
      WHERE c.table_name = ${name} AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `;

    const pkColumns = columns.filter(c => c.is_primary_key).map(c => c.column_name);

    // Build WHERE clause
    let whereClause = '';
    const conditions: string[] = [];

    if (filterCol && filterVal) {
      conditions.push(`"${filterCol}"::text LIKE '%${filterVal.replace(/'/g, "''")}%'`);
    }

    if (search) {
      const searchableCols = columns
        .filter(c => ['text', 'varchar', 'character varying', 'citext'].includes(c.data_type))
        .map(c => `"${c.column_name}"::text`);
      if (searchableCols.length > 0) {
        conditions.push(`(${searchableCols.join(' || ')}) LIKE '%${search.replace(/'/g, "''")}%'`);
      }
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Build ORDER clause
    let orderClause = '';
    if (sortBy) {
      orderClause = `ORDER BY "${sortBy}" ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;
    } else if (pkColumns.length > 0) {
      orderClause = `ORDER BY "${pkColumns[0]}" ASC`;
    }

    // Get total row count (with filter)
    const countSql = `SELECT COUNT(*) AS count FROM "${name}" ${whereClause}`;
    const countResult = await db.$queryRawUnsafe(countSql);
    const totalRows = Number((countResult as any[])[0]?.count || 0);

    // Get rows with pagination
    const rowsSql = `SELECT * FROM "${name}" ${whereClause} ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await db.$queryRawUnsafe(rowsSql);

    return NextResponse.json({
      success: true,
      table: name,
      columns: columns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES',
        default: c.column_default,
        maxLength: c.character_maximum_length,
        isPrimaryKey: c.is_primary_key,
      })),
      primaryKeys: pkColumns,
      rows: rows as Record<string, any>[],
      pagination: {
        page,
        pageSize,
        totalRows,
        totalPages: Math.ceil(totalRows / pageSize),
      },
    });
  } catch (error: any) {
    console.error('DB Manager: Error browsing table:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar dados da tabela' },
      { status: 500 }
    );
  }
}

// ── POST: Insert row ──
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { data } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dados invalidos para insercao' },
        { status: 400 }
      );
    }

    const cols = Object.keys(data);
    const vals = Object.values(data).map((v: any) => {
      if (v === null || v === undefined || v === '') return 'NULL';
      if (typeof v === 'number') return String(v);
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      return `'${String(v).replace(/'/g, "''")}'`;
    });

    const sql = `INSERT INTO "${name}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`;
    const result = await db.$queryRawUnsafe(sql);

    return NextResponse.json({ success: true, row: result[0], message: 'Registo inserido com sucesso' });
  } catch (error: any) {
    console.error('DB Manager: Error inserting row:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao inserir registo' },
      { status: 500 }
    );
  }
}

// ── PUT: Update row ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { data, keys } = body;

    if (!data || typeof data !== 'object' || !keys || typeof keys !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dados ou chave primaria invalidos' },
        { status: 400 }
      );
    }

    const setClause = Object.entries(data)
      .filter(([k]) => !(k in keys)) // Don't update primary key columns
      .map(([k, v]) => {
        if (v === null || v === undefined || v === '') return `"${k}" = NULL`;
        if (typeof v === 'number') return `"${k}" = ${v}`;
        if (typeof v === 'boolean') return `"${k}" = ${v ? 'TRUE' : 'FALSE'}`;
        return `"${k}" = '${String(v).replace(/'/g, "''")}'`;
      })
      .join(', ');

    if (!setClause) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar (apenas chave primaria fornecida)' },
        { status: 400 }
      );
    }

    const whereClause = Object.entries(keys)
      .map(([k, v]) => {
        if (typeof v === 'number') return `"${k}" = ${v}`;
        return `"${k}" = '${String(v).replace(/'/g, "''")}'`;
      })
      .join(' AND ');

    const sql = `UPDATE "${name}" SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const result = await db.$queryRawUnsafe(sql);

    if ((result as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Registo nao encontrado para atualizacao' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, row: (result as any[])[0], message: 'Registo atualizado com sucesso' });
  } catch (error: any) {
    console.error('DB Manager: Error updating row:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar registo' },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete row ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { keys } = body;

    if (!keys || typeof keys !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Chave primaria nao fornecida' },
        { status: 400 }
      );
    }

    const whereClause = Object.entries(keys)
      .map(([k, v]) => {
        if (typeof v === 'number') return `"${k}" = ${v}`;
        return `"${k}" = '${String(v).replace(/'/g, "''")}'`;
      })
      .join(' AND ');

    const sql = `DELETE FROM "${name}" WHERE ${whereClause} RETURNING *`;
    const result = await db.$queryRawUnsafe(sql);

    if ((result as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Registo nao encontrado para eliminacao' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Registo eliminado com sucesso', deletedRow: (result as any[])[0] });
  } catch (error: any) {
    console.error('DB Manager: Error deleting row:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao eliminar registo' },
      { status: 500 }
    );
  }
}
