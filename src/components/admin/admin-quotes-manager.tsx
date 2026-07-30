'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  ClipboardList, Eye, Pencil, Clock, CheckCircle2, XCircle, AlertCircle, DollarSign,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface QuoteData {
  id: string;
  title?: string;
  subject?: string;
  description?: string;
  status: string;
  budget?: number;
  serviceType?: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string };
}

export function AdminQuotesManager() {
  const { t, formatDate, formatCurrency } = useLanguage();
  const { toast } = useToast();

  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusQuote, setStatusQuote] = useState<QuoteData | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/quotes');
      const data = await safeJson(res);
      if (data && data.success) {
        setQuotes(data.data || []);
      }
    } catch (err) {
      console.error('Quotes fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const openDetail = (quote: QuoteData) => {
    setSelectedQuote(quote);
    setDetailOpen(true);
  };

  const openStatusChange = (quote: QuoteData) => {
    setStatusQuote(quote);
    setNewStatus(quote.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusQuote || !newStatus) return;
    setStatusSaving(true);
    try {
      const res = await apiFetch('/api/admin/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: statusQuote.id, status: newStatus }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Updated', description: t('admin.quotes') || 'Quote updated' });
        setStatusDialogOpen(false);
        fetchQuotes();
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to update quote', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update quote', variant: 'destructive' });
    } finally {
      setStatusSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />{t('common.pending') || 'Pending'}</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle2 className="h-3 w-3 mr-1" />{t('common.approved') || 'Approved'}</Badge>;
      case 'in_progress':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><AlertCircle className="h-3 w-3 mr-1" />{t('common.inProgress') || 'In Progress'}</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{t('common.completed') || 'Completed'}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />{t('common.rejected') || 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            {t('admin.quotes') || 'Quotes Management'}
          </h2>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            {quotes.length} {t('common.total') || 'total'}
          </Badge>
        </div>
      </motion.div>

      {/* Quotes Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.quotes') || 'Quotes'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading') || 'Loading...'}</div>
            ) : quotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No quotes'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.itemTitle') || 'Title'}</TableHead>
                    <TableHead>{t('admin.name') || 'User'}</TableHead>
                    <TableHead>{t('admin.status') || 'Status'}</TableHead>
                    <TableHead>{t('financial.amount') || 'Budget'}</TableHead>
                    <TableHead>{t('admin.date') || 'Date'}</TableHead>
                    <TableHead>{t('admin.actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{quote.title || quote.subject || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{quote.user?.name || quote.userId?.slice(0, 8) || '—'}</TableCell>
                      <TableCell>{statusBadge(quote.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{quote.budget ? formatCurrency(quote.budget) : '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openDetail(quote)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openStatusChange(quote)}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quote Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              {selectedQuote?.title || selectedQuote?.subject || t('admin.quotes') || 'Quote Details'}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Quote details'}</DialogDescription>
          </DialogHeader>
          <Separator />
          {selectedQuote && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {statusBadge(selectedQuote.status)}
                <span className="text-xs text-muted-foreground">{formatDate(selectedQuote.createdAt)}</span>
              </div>
              {selectedQuote.user && (
                <div className="text-sm text-muted-foreground">
                  {t('admin.name') || 'User'}: {selectedQuote.user.name} ({selectedQuote.user.email})
                </div>
              )}
              {selectedQuote.budget && (
                <div className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  {t('financial.amount') || 'Budget'}: {formatCurrency(selectedQuote.budget)}
                </div>
              )}
              {selectedQuote.serviceType && (
                <div className="text-sm text-muted-foreground">
                  {t('admin.category') || 'Service'}: {selectedQuote.serviceType}
                </div>
              )}
              {selectedQuote.description && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">{selectedQuote.description}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.editItem') || 'Change Status'}</DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Update quote status'}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.status') || 'Status'}</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.status') || 'Select status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('common.pending') || 'Pending'}</SelectItem>
                  <SelectItem value="approved">{t('common.approved') || 'Approved'}</SelectItem>
                  <SelectItem value="in_progress">{t('common.inProgress') || 'In Progress'}</SelectItem>
                  <SelectItem value="completed">{t('common.completed') || 'Completed'}</SelectItem>
                  <SelectItem value="rejected">{t('common.rejected') || 'Rejected'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{t('admin.cancel') || 'Cancel'}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleStatusChange} disabled={statusSaving}>
              {statusSaving ? 'Saving...' : t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
