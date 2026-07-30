'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Banknote, AlertCircle, RefreshCw, Wallet, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useToast } from '@/hooks/use-toast';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface WithdrawalData { id: string; amount: number; status: string; method: string; createdAt: string; }

export function PartnerWithdrawals() {
  const { t, formatDate, formatCurrency } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/partner/withdrawals?userId=${user?.id || 'demo-partner-001'}`);
      const data = await safeJson(res);
      if (data && data.success) {
        setWithdrawals(data.data || []);
      } else {
        setError(data?.message || t('common.serverNonJson'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleRequestWithdrawal = async () => {
    if (!withdrawAmount || !withdrawMethod) {
      toast({ title: t('common.error') || 'Error', description: t('partner.amountPlaceholder') || 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const parsedAmount = parseFloat(withdrawAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: t('common.error') || 'Error', description: t('partner.amountPlaceholder') || 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/partner/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: user?.id || 'demo-partner-001',
          amount: parsedAmount,
          method: withdrawMethod,
          accountDetails: accountDetails || null,
        }),
      });

      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('common.approved') || 'Success', description: t('partner.withdrawalsRequest') || 'Withdrawal request submitted' });
        setWithdrawAmount('');
        setWithdrawMethod('');
        setAccountDetails('');
        fetchWithdrawals();
      } else {
        toast({ title: t('common.error') || 'Error', description: data?.message || 'Failed to submit withdrawal', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: t('common.error') || 'Error', description: err.message || 'Failed to submit withdrawal', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{t('common.approved')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />{t('common.pending')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />{t('common.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <motion.div variants={containerVariants} initial="hidden" animate="visible"><Skeleton className="h-64 w-full rounded-xl" /></motion.div>;
  if (error) return <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-500" /><p>{error}</p></div><Button className="mt-4" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />{t('common.retry')}</Button></CardContent></Card>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Banknote className="h-6 w-6 text-emerald-600" />{t('partner.withdrawals')}</h2>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-600" />{t('partner.withdrawalsRequest')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="withdraw-amount">{t('financial.amount')} (MT)</Label><Input id="withdraw-amount" type="number" placeholder={t('partner.amountPlaceholder')} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t('financial.paymentMethod')}</Label><Select value={withdrawMethod} onValueChange={setWithdrawMethod}><SelectTrigger className="w-full"><SelectValue placeholder={t('partner.selectMethod')} /></SelectTrigger><SelectContent><SelectItem value="mpesa">{t('financial.mpesa')}</SelectItem><SelectItem value="transfer">{t('financial.transfer')}</SelectItem></SelectContent></Select></div>
            </div>
            {withdrawMethod && (
              <div className="space-y-2">
                <Label htmlFor="account-details">{t('partner.accountDetails') || 'Account Details'}</Label>
                <Input id="account-details" placeholder={withdrawMethod === 'mpesa' ? '+258 84 XXX XXXX' : t('partner.accountNumber')} value={accountDetails} onChange={(e) => setAccountDetails(e.target.value)} />
              </div>
            )}
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={handleRequestWithdrawal} disabled={submitting}>
              <Banknote className="h-4 w-4 mr-2" />
              {submitting ? (t('common.loading') || 'Submitting...') : t('partner.withdrawalsRequest')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle>{t('partner.withdrawalHistory')}</CardTitle></CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? <div className="text-center py-8"><p className="text-sm text-muted-foreground">{t('partner.noWithdrawals')}</p></div> :
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-sm">{formatCurrency(w.amount)} — {w.method || t('partner.commission')}</span></div>
                  <div className="text-right">{statusBadge(w.status)}<p className="text-xs text-muted-foreground mt-1">{formatDate(w.createdAt)}</p></div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
