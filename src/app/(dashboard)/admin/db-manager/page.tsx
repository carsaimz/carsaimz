'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { buildApiUrl } from '@/lib/api-base';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  FolderOpen,
  FileText,
  Trash2,
  Download,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Hash,
} from 'lucide-react';

interface CollectionInfo {
  name: string;
  count: number;
}

interface DocumentData {
  id: string;
  [key: string]: any;
}

interface PaginatedDocs {
  documents: DocumentData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DbManagerPage() {
  const { t } = useLanguage();

  // ── State ──
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch collections ──
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl('/api/admin/db-manager'));
      const json = await res.json();
      if (json.success) {
        setCollections(json.data);
      } else {
        setError(json.message || 'Failed to fetch collections');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch documents in a collection ──
  const fetchDocuments = useCallback(async (colName: string, pageNum: number = 1) => {
    setDocLoading(true);
    setError(null);
    try {
      const res = await fetch(
        buildApiUrl(`/api/admin/db-manager?collection=${encodeURIComponent(colName)}&page=${pageNum}&limit=20`)
      );
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents);
        setTotalDocs(json.data.total);
        setPage(json.data.page);
        setTotalPages(json.data.totalPages);
      } else {
        setError(json.message || 'Failed to fetch documents');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setDocLoading(false);
    }
  }, []);

  // ── Fetch single document ──
  const fetchDocument = useCallback(async (colName: string, docId: string) => {
    setDocLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/api/admin/db-manager?collection=${encodeURIComponent(colName)}&docId=${encodeURIComponent(docId)}`)
      );
      const json = await res.json();
      if (json.success) {
        setSelectedDoc(json.data);
      }
    } catch (err) {
      // ignore
    } finally {
      setDocLoading(false);
    }
  }, []);

  // ── Delete document ──
  const deleteDocument = useCallback(async (colName: string, docId: string) => {
    try {
      const res = await fetch(
        buildApiUrl(`/api/admin/db-manager?collection=${encodeURIComponent(colName)}&docId=${encodeURIComponent(docId)}`),
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (json.success) {
        // Refresh documents
        if (selectedCollection) {
          fetchDocuments(selectedCollection, page);
        }
        if (selectedDoc?.id === docId) {
          setSelectedDoc(null);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [selectedCollection, page, fetchDocuments, selectedDoc]);

  // ── Export collection as JSON ──
  const exportCollection = useCallback(async (colName: string) => {
    try {
      const res = await fetch(
        buildApiUrl(`/api/admin/db-manager?collection=${encodeURIComponent(colName)}&limit=10000`)
      );
      const json = await res.json();
      if (json.success) {
        const blob = new Blob([JSON.stringify(json.data.documents, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${colName}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // ── Auto-load collections on mount ──
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // ── Handle collection click ──
  const handleCollectionClick = (colName: string) => {
    setSelectedCollection(colName);
    setSelectedDoc(null);
    setDocuments([]);
    setPage(1);
    fetchDocuments(colName, 1);
  };

  // ── Handle back to collections ──
  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setDocuments([]);
    setSelectedDoc(null);
    setPage(1);
    fetchCollections();
  };

  // ── Handle back to documents ──
  const handleBackToDocuments = () => {
    setSelectedDoc(null);
  };

  // ── Render a value for the table ──
  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  };

  // ── Truncate long strings ──
  const truncate = (str: string, maxLen: number = 40): string => {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + '…';
  };

  // ── Get document field keys (excluding id) ──
  const getFieldKeys = (docs: DocumentData[]): string[] => {
    if (docs.length === 0) return [];
    const keySet = new Set<string>();
    docs.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        if (key !== 'id') keySet.add(key);
      });
    });
    return Array.from(keySet).slice(0, 5); // Show at most 5 fields in the table
  };

  // ── Document detail view ──
  const renderDocumentDetail = () => {
    if (!selectedDoc) return null;

    const entries = Object.entries(selectedDoc).filter(([key]) => key !== 'id');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToDocuments}>
              <ArrowLeft className="size-4 mr-1" />
              {t('admin.documents')}
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4 mr-1" />
                {t('admin.deleteDocument')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('admin.deleteDocument')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('admin.confirmDeleteDoc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selectedCollection && selectedDoc) {
                      deleteDocument(selectedCollection, selectedDoc.id);
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              {selectedDoc.id}
            </CardTitle>
            <CardDescription>
              {selectedCollection} / {selectedDoc.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {entries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start gap-3 py-2 border-b last:border-b-0"
                >
                  <span className="text-sm font-medium text-muted-foreground min-w-[160px] shrink-0">
                    {key}
                  </span>
                  <span className="text-sm break-all">
                    {typeof value === 'object' && value !== null ? (
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-w-full">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      renderValue(value)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Documents view ──
  const renderDocuments = () => {
    const fieldKeys = getFieldKeys(documents);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToCollections}>
              <ArrowLeft className="size-4 mr-1" />
              {t('admin.collections')}
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{selectedCollection}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {totalDocs} {t('admin.documents').toLowerCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCollection(selectedCollection!)}
            >
              <Download className="size-4 mr-1" />
              {t('admin.exportCollection')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments(selectedCollection!, page)}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {docLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('admin.noItems')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">ID</TableHead>
                        {fieldKeys.map((key) => (
                          <TableHead key={key}>{truncate(key, 20)}</TableHead>
                        ))}
                        <TableHead className="w-[100px] text-right">
                          {t('admin.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => fetchDocument(selectedCollection!, doc.id)}
                        >
                          <TableCell className="font-mono text-xs">
                            {truncate(doc.id, 20)}
                          </TableCell>
                          {fieldKeys.map((key) => (
                            <TableCell key={key} className="text-sm">
                              {truncate(renderValue(doc[key]), 40)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t('admin.deleteDocument')}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('admin.confirmDeleteDoc')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDocument(selectedCollection!, doc.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchDocuments(selectedCollection!, page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchDocuments(selectedCollection!, page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ── Collections view ──
  const renderCollections = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('admin.collections')}</h2>
          <p className="text-sm text-muted-foreground">
            {collections.length} {t('admin.collections').toLowerCase()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCollections}>
          <RefreshCw className="size-4 mr-1" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card
              key={col.name}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCollectionClick(col.name)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderOpen className="size-4 text-muted-foreground" />
                  {col.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Hash className="size-3.5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{col.count}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('admin.documentCount').toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ── Main render ──
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">{t('admin.dbManager')}</h1>
          <p className="text-sm text-muted-foreground">
            Firestore {t('admin.dbManager').toLowerCase()}
          </p>
        </div>
      </div>

      {selectedDoc
        ? renderDocumentDetail()
        : selectedCollection
          ? renderDocuments()
          : renderCollections()}
    </div>
  );
}
