'use client';

/* eslint-disable react-hooks/set-state-in-effect, react/jsx-key */

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import {
  Database, Table2, Play, RefreshCw, ChevronLeft, ChevronRight,
  Search, Plus, Pencil, Trash2, X, Eye, Download, AlertTriangle,
  CheckCircle, Loader2, Code, ArrowUpDown, Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Types ──
interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  maxLength: number | null;
  isPrimaryKey: boolean;
}

interface TableInfo {
  name: string;
  rowCount: number;
  totalSize: number;
  indexSize: number;
  columns: TableColumn[];
}

interface TableData {
  table: string;
  columns: TableColumn[];
  primaryKeys: string[];
  rows: Record<string, any>[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
}

// ── Helpers ──
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function truncateValue(val: any, maxLen = 80): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val);
  if (str.length > maxLen) return str.substring(0, maxLen) + '...';
  return str;
}

export function DBManager() {
  const { t } = useLanguage();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('browse');

  // Browse state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [searchQuery, setSearchQuery] = useState('');

  // SQL Query state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryRunning, setQueryRunning] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'insert' | 'update'>('insert');
  const [editRow, setEditRow] = useState<Record<string, any>>({});
  const [editKeys, setEditKeys] = useState<Record<string, any>>({});

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Record<string, any> | null>(null);

  // Operation feedback
  const [opMessage, setOpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Load tables ──
  const loadTables = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/db-manager/tables');
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
      } else {
        setError(data.error || 'Erro ao carregar tabelas');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  // ── Load table data ──
  const loadTableData = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
        search: searchQuery,
      });
      const res = await fetch(`/api/admin/db-manager/tables/${selectedTable}?${params}`);
      const data = await res.json();
      if (data.success) {
        setTableData(data);
      } else {
        setError(data.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [selectedTable, page, pageSize, sortBy, sortOrder, searchQuery]);

  // ── Effects ──
  useEffect(() => { loadTables(); }, [loadTables]);
  useEffect(() => { if (selectedTable) loadTableData(); }, [loadTableData]);

  // ── SQL Query execution ──
  const executeQuery = async () => {
    setQueryRunning(true);
    setQueryResult(null);
    try {
      const res = await fetch('/api/admin/db-manager/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({ success: false, error: err.message });
    }
    setQueryRunning(false);
  };

  // ── CRUD operations ──
  const handleInsert = () => {
    if (!tableData) return;
    const newRow: Record<string, any> = {};
    tableData.columns.forEach(col => {
      newRow[col.name] = col.default || null;
    });
    setEditRow(newRow);
    setEditKeys({});
    setEditMode('insert');
    setEditDialogOpen(true);
  };

  const handleEdit = (row: Record<string, any>) => {
    if (!tableData) return;
    const keys: Record<string, any> = {};
    tableData.primaryKeys.forEach(pk => { keys[pk] = row[pk]; });
    setEditRow({ ...row });
    setEditKeys(keys);
    setEditMode('update');
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (row: Record<string, any>) => {
    setDeleteRow(row);
    setDeleteDialogOpen(true);
  };

  const saveRow = async () => {
    if (!selectedTable) return;
    try {
      // Clean up empty values → null
      const cleanedRow = { ...editRow };
      for (const [k, v] of Object.entries(cleanedRow)) {
        if (v === '' || v === undefined) cleanedRow[k] = null;
      }

      const res = await fetch(`/api/admin/db-manager/tables/${selectedTable}`, {
        method: editMode === 'insert' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: cleanedRow,
          keys: editKeys,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOpMessage({ type: 'success', text: data.message });
        setEditDialogOpen(false);
        loadTableData();
        loadTables(); // Refresh row counts
      } else {
        setOpMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setOpMessage({ type: 'error', text: err.message });
    }
  };

  const confirmDelete = async () => {
    if (!selectedTable || !deleteRow || !tableData) return;
    const keys: Record<string, any> = {};
    tableData.primaryKeys.forEach(pk => { keys[pk] = deleteRow[pk]; });
    try {
      const res = await fetch(`/api/admin/db-manager/tables/${selectedTable}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      if (data.success) {
        setOpMessage({ type: 'success', text: data.message });
        setDeleteDialogOpen(false);
        setDeleteRow(null);
        loadTableData();
        loadTables();
      } else {
        setOpMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setOpMessage({ type: 'error', text: err.message });
    }
  };

  // ── Export table as CSV ──
  const exportCSV = () => {
    if (!tableData?.rows?.length) return;
    const headers = tableData.columns.map(c => c.name);
    const csvRows = [headers.join(',')];
    for (const row of tableData.rows) {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      });
      csvRows.push(values.join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Auto-dismiss message ──
  useEffect(() => {
    if (opMessage) {
      const timer = setTimeout(() => setOpMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [opMessage]);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Gestor de Base de Dados</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadTables(); if (selectedTable) loadTableData(); }} disabled={loading}>
          <RefreshCw className={`size-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* ── Feedback message ── */}
      {opMessage && (
        <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${opMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
          {opMessage.type === 'success' ? <CheckCircle className="size-4" /> : <AlertTriangle className="size-4" />}
          {opMessage.text}
          <Button variant="ghost" size="icon" className="size-5 ml-auto" onClick={() => setOpMessage(null)}><X className="size-3" /></Button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-sm">
          <AlertTriangle className="size-4" />
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="browse" className="flex items-center gap-1"><Table2 className="size-3" /> Tabelas</TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-1"><Eye className="size-3" /> Estrutura</TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-1"><Code className="size-3" /> Consulta SQL</TabsTrigger>
        </TabsList>

        {/* ── Tab: Browse ── */}
        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* ── Table list ── */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Table2 className="size-4" /> Tabelas ({tables.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {tables.map(tbl => (
                      <button
                        key={tbl.name}
                        onClick={() => { setSelectedTable(tbl.name); setPage(1); setSearchQuery(''); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedTable === tbl.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{tbl.name}</span>
                          <Badge variant="secondary" className="text-xs ml-1 shrink-0">{tbl.rowCount}</Badge>
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">
                          {tbl.columns.length} colunas · {formatSize(tbl.totalSize)}
                        </div>
                      </button>
                    ))}
                    {tables.length === 0 && !loading && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tabela encontrada</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* ── Data grid ── */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Database className="size-4" />
                  {selectedTable || 'Seleccione uma tabela'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  {selectedTable && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleInsert} className="h-8">
                        <Plus className="size-3.5 mr-1" /> Novo
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportCSV} className="h-8">
                        <Download className="size-3.5 mr-1" /> CSV
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm">Carregando...</span>
                  </div>
                )}

                {!loading && tableData && (
                  <>
                    {/* ── Pagination info ── */}
                    <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                      <span>
                        Pagina {tableData.pagination.page} de {tableData.pagination.totalPages} ·
                        {tableData.pagination.totalRows} registos
                      </span>
                      <div className="flex items-center gap-1">
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                          <SelectTrigger className="w-[70px] h-6 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* ── Data table ── */}
                    <ScrollArea className="w-full">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-2 py-1.5 text-left w-8 sticky left-0 bg-muted/50 z-10">#</th>
                              <th className="px-2 py-1.5 text-center w-20 sticky left-8 bg-muted/50 z-10">Acções</th>
                              {tableData.columns.map(col => (
                                <th
                                  key={col.name}
                                  className="px-2 py-1.5 text-left whitespace-nowrap cursor-pointer hover:bg-muted"
                                  onClick={() => { setSortBy(col.name); setSortOrder(sortBy === col.name && sortOrder === 'ASC' ? 'DESC' : 'ASC'); }}
                                >
                                  <div className="flex items-center gap-1">
                                    {col.isPrimaryKey && <Key className="size-3 text-yellow-500" />}
                                    {col.name}
                                    {sortBy === col.name && <ArrowUpDown className="size-3" />}
                                    <span className="text-muted-foreground font-normal">{col.type}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.rows.map((row, idx) => (
                              <tr key={idx} className="border-b hover:bg-muted/30">
                                <td className="px-2 py-1 sticky left-0 bg-background z-10 text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                                <td className="px-2 py-1 sticky left-8 bg-background z-10">
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="size-5 h-5 w-5" onClick={() => handleEdit(row)}><Pencil className="size-3" /></Button>
                                    <Button variant="ghost" size="icon" className="size-5 h-5 w-5 text-red-500" onClick={() => handleDeleteClick(row)}><Trash2 className="size-3" /></Button>
                                  </div>
                                </td>
                                {tableData.columns.map(col => (
                                  <td key={col.name} className="px-2 py-1 max-w-[200px] truncate">
                                    <span className={`${row[col.name] === null ? 'italic text-muted-foreground' : ''}`}>
                                      {truncateValue(row[col.name], 60)}
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {tableData.rows.length === 0 && (
                              <tr>
                                <td colSpan={tableData.columns.length + 2} className="text-center py-8 text-muted-foreground">
                                  Nenhum registo encontrado
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>

                    {/* ── Pagination controls ── */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-sm">{page} / {tableData.pagination.totalPages || 1}</span>
                      <Button variant="outline" size="sm" disabled={page >= tableData.pagination.totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </>
                )}

                {!loading && !selectedTable && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Seleccione uma tabela para ver os seus dados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Structure ── */}
        <TabsContent value="structure" className="space-y-4">
          {!selectedTable && tables.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Carregando tabelas...</p>
            </div>
          )}

          {tables.length > 0 && !selectedTable && (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Seleccione uma tabela na aba "Tabelas" para ver a sua estrutura</p>
            </div>
          )}

          {selectedTable && tableData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1">
                  <Eye className="size-4" />
                  Estrutura: {selectedTable}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* ── Table summary ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground">Colunas</div>
                    <div className="text-lg font-semibold">{tableData.columns.length}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground">Registos</div>
                    <div className="text-lg font-semibold">{tableData.pagination.totalRows}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground">Chave Primária</div>
                    <div className="text-sm font-semibold">{tableData.primaryKeys.join(', ') || 'N/A'}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground">Paginas</div>
                    <div className="text-lg font-semibold">{tableData.pagination.totalPages}</div>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* ── Column details ── */}
                <ScrollArea className="w-full">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left">Coluna</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-center">Nulo?</th>
                        <th className="px-3 py-2 text-center">PK?</th>
                        <th className="px-3 py-2 text-left">Padrao</th>
                        <th className="px-3 py-2 text-center">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.columns.map(col => (
                        <tr key={col.name} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{col.name}</td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary" className="text-xs">{col.type}</Badge>
                            {col.maxLength && <span className="text-xs ml-1 text-muted-foreground">({col.maxLength})</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {col.nullable ? <span className="text-green-500 text-xs">SIM</span> : <span className="text-red-500 text-xs">NO</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {col.isPrimaryKey ? <Key className="size-4 text-yellow-500 mx-auto" /> : ''}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{col.default || '—'}</td>
                          <td className="px-3 py-2 text-center text-xs">{col.maxLength || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* ── All tables overview ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1">
                <Database className="size-4" /> Resumo de Todas as Tabelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left">Tabela</th>
                      <th className="px-3 py-2 text-center">Colunas</th>
                      <th className="px-3 py-2 text-center">Registos</th>
                      <th className="px-3 py-2 text-right">Tamanho</th>
                      <th className="px-3 py-2 text-right">Indices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map(tbl => (
                      <tr key={tbl.name} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedTable(tbl.name); setActiveTab('structure'); }}>
                        <td className="px-3 py-2 font-medium">{tbl.name}</td>
                        <td className="px-3 py-2 text-center">{tbl.columns.length}</td>
                        <td className="px-3 py-2 text-center">{tbl.rowCount}</td>
                        <td className="px-3 py-2 text-right">{formatSize(tbl.totalSize)}</td>
                        <td className="px-3 py-2 text-right">{formatSize(tbl.indexSize)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: SQL Query ── */}
        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1">
                <Code className="size-4" /> Consulta SQL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="SELECT * FROM users LIMIT 10;"
                className="min-h-[120px] font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <Button onClick={executeQuery} disabled={queryRunning || !sqlQuery.trim()}>
                  {queryRunning ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Play className="size-4 mr-1" />}
                  Executar
                </Button>
                <div className="flex-1" />
                <div className="text-xs text-muted-foreground">
                  Tipos aceites: SELECT, INSERT, UPDATE, DELETE
                </div>
              </div>

              {/* ── Query result ── */}
              {queryResult && (
                <div className="space-y-2">
                  {queryResult.success ? (
                    <>
                      <div className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">
                        <CheckCircle className="size-4" />
                        {queryResult.message}
                      </div>

                      {queryResult.isSelect && queryResult.rows?.length > 0 && (
                        <ScrollArea className="w-full max-h-[400px]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  {Object.keys(queryResult.rows[0]).map(key => (
                                    <th key={key} className="px-2 py-1.5 text-left whitespace-nowrap">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.rows.slice(0, 200).map((row: any, idx: number) => (
                                  <tr key={idx} className="border-b hover:bg-muted/30">
                                    {Object.entries(row).map(([key, val]) => (
                                      <td key={key} className="px-2 py-1 max-w-[150px] truncate">{truncateValue(val)}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </ScrollArea>
                      )}

                      {queryResult.isSelect && queryResult.rows?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum registo retornado</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                      <AlertTriangle className="size-4" />
                      {queryResult.error || 'Erro desconhecido'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Quick query templates ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Consultas Rapidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tables.map(tbl => (
                  <Button
                    key={tbl.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSqlQuery(`SELECT * FROM ${tbl.name} ORDER BY id LIMIT 25;`)}
                  >
                    <Table2 className="size-3 mr-1" />
                    {tbl.name} ({tbl.rowCount})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit/Insert Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              {editMode === 'insert' ? <Plus className="size-4" /> : <Pencil className="size-4" />}
              {editMode === 'insert' ? 'Inserir Novo Registo' : 'Editar Registo'} — {selectedTable}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {tableData?.columns.map(col => {
                const isPk = col.isPrimaryKey && editMode === 'update';
                const value = editRow[col.name];
                return (
                  <div key={col.name} className="grid grid-cols-[140px_1fr] gap-2 items-start">
                    <label className="text-sm font-medium pt-1.5 flex items-center gap-1">
                      {col.isPrimaryKey && <Key className="size-3 text-yellow-500" />}
                      {col.name}
                      {isPk && <Badge variant="secondary" className="text-xs">PK</Badge>}
                    </label>
                    {isPk ? (
                      <Input value={String(value ?? '')} disabled className="h-8 text-sm bg-muted" />
                    ) : (
                      <Input
                        value={value === null ? '' : String(value)}
                        onChange={(e) => {
                          const newVal = e.target.value === '' ? null : e.target.value;
                          // Auto-convert numeric fields
                          if (col.type === 'integer' || col.type === 'bigint') {
                            setEditRow(prev => ({ ...prev, [col.name]: newVal === null ? null : Number(newVal) }));
                          } else if (col.type === 'boolean') {
                            setEditRow(prev => ({ ...prev, [col.name]: newVal === 'true' }));
                          } else {
                            setEditRow(prev => ({ ...prev, [col.name]: newVal }));
                          }
                        }}
                        placeholder={col.nullable ? 'NULL' : col.type}
                        className="h-8 text-sm"
                      />
                    )}
                    <div className="col-span-2 text-xs text-muted-foreground -mt-1">
                      Tipo: {col.type} {col.nullable ? '(nulo permitido)' : '(obrigatorio)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveRow}>
              {editMode === 'insert' ? <Plus className="size-4 mr-1" /> : <Pencil className="size-4 mr-1" />}
              {editMode === 'insert' ? 'Inserir' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1 text-red-600">
              <Trash2 className="size-4" />
              Confirmar Eliminacao
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">Tem certeza que deseja eliminar este registo da tabela <strong>{selectedTable}</strong>?</p>
            {deleteRow && tableData && (
              <div className="p-2 rounded bg-muted text-xs space-y-1">
                {tableData.primaryKeys.map(pk => (
                  <div><span className="font-medium">{pk}:</span> {String(deleteRow[pk])}</div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Esta accao e irreversivel.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="size-4 mr-1" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
