'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDocumentTitle } from '@/hooks/use-document-title';
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
  CreditCard, Eye, Pencil, Clock, CheckCircle2, XCircle, AlertCircle, DollarSign,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface PaymentData {
  id: string;
  amount: number;
  status: string;
  method?: string;
  description?: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string };
}

export function AdminPaymentsManager() {
  const { t, formatDate, formatCurrency } = useLanguage();
  useDocumentTitle('admin.payments', 'Pagamentos');
  const { toast } = useToast();

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusPayment, setStatusPayment] = useState<PaymentData | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/payments');
      const data = await safeJson(res);
      if (data && data.success) {
        setPayments(data.data || []);
      }
    } catch (err) {
      console.error('Payments fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const openDetail = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setDetailOpen(true);
  };

  const openStatusChange = (payment: PaymentData) => {
    setStatusPayment(payment);
    setNewStatus(payment.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusPayment || !newStatus) return;
    setStatusSaving(true);
    try {
      const res = await apiFetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: statusPayment.id, status: newStatus }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Updated', description: t('admin.payments') || 'Payment updated' });
        setStatusDialogOpen(false);
        fetchPayments();
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to update payment', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update payment', variant: 'destructive' });
    } finally {
      setStatusSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />{t('common.pending') || 'Pending'}</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="h-3 w-3 mr-1" />{t('common.completed') || 'Completed'}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />{t('common.rejected') || 'Failed'}</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><AlertCircle className="h-3 w-3 mr-1" />{t('financial.refunded') || 'Refunded'}</Badge>;
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
            <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.payments') || 'Payments Management'}
          </h2>
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
            {payments.length} {t('common.total') || 'total'}
          </Badge>
        </div>
      </motion.div>

      {/* Payments Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.payments') || 'Payments'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading') || 'Loading...'}</div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No payments'}</div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('financial.amount') || 'Amount'}</TableHead>
                    <TableHead>{t('admin.name') || 'User'}</TableHead>
                    <TableHead>{t('admin.status') || 'Status'}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('financial.paymentMethod') || 'Method'}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('admin.date') || 'Date'}</TableHead>
                    <TableHead>{t('admin.actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-semibold whitespace-nowrap">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{payment.user?.name || payment.userId?.slice(0, 8) || '—'}</TableCell>
                      <TableCell>{statusBadge(payment.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{payment.method || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs whitespace-nowrap">{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openDetail(payment)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openStatusChange(payment)}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {t('admin.payments') || 'Payment Details'}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Payment details'}</DialogDescription>
          </DialogHeader>
          <Separator />
          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {statusBadge(selectedPayment.status)}
                <span className="text-xs text-muted-foreground">{formatDate(selectedPayment.createdAt)}</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedPayment.amount)}</div>
              {selectedPayment.user && (
                <div className="text-sm text-muted-foreground">
                  {t('admin.name') || 'User'}: {selectedPayment.user.name} ({selectedPayment.user.email})
                </div>
              )}
              {selectedPayment.method && (
                <div className="text-sm text-muted-foreground">
                  {t('financial.paymentMethod') || 'Method'}: {selectedPayment.method}
                </div>
              )}
              {selectedPayment.description && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">{selectedPayment.description}</div>
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
            <DialogDescription>{t('admin.contentManager') || 'Update payment status'}</DialogDescription>
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
                  <SelectItem value="completed">{t('common.completed') || 'Completed'}</SelectItem>
                  <SelectItem value="failed">{t('common.rejected') || 'Failed'}</SelectItem>
                  <SelectItem value="refunded">{t('financial.refunded') || 'Refunded'}</SelectItem>
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
