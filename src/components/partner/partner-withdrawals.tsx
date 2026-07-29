'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Banknote, AlertCircle, RefreshCw, Wallet, CheckCircle2 } from 'lucide-react';
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

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface WithdrawalData { id: string; amount: number; status: string; createdAt: string; }

export function PartnerWithdrawals() {
  const { t, formatDate, formatCurrency } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');

  useEffect(() => {
    apiFetch(`/api/dashboard?role=partner&userId=${user?.id || 'demo-partner-001'}`)
      .then((res) => safeJson(res))
      .then((data) => { if (!data) { setError(t('common.serverNonJson')); return; } if (data.success && data.data) { const paidCommissions = (data.data.recentActivity?.commissions || []).filter((c: any) => c.status === 'paid'); setWithdrawals(paidCommissions); } else setError(data.message); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"><Banknote className="h-4 w-4 mr-2" />{t('partner.withdrawalsRequest')}</Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle>{t('partner.withdrawalHistory')}</CardTitle></CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? <div className="text-center py-8"><p className="text-sm text-muted-foreground">{t('partner.noWithdrawals')}</p></div> :
            <div className="space-y-2">
              {withdrawals.slice(0, 5).map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-sm">{formatCurrency(w.amount)} — {t('partner.commission')}</span></div>
                  <div className="text-right"><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge><p className="text-xs text-muted-foreground mt-1">{formatDate(w.createdAt)}</p></div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
