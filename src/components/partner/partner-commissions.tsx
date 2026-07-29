'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Percent, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch } from '@/lib/api-fetch';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface CommissionData { id: string; amount: number; status: string; createdAt: string; }

export function PartnerCommissions() {
  const { t, formatDate, formatCurrency } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/dashboard?role=partner&userId=${user?.id || 'demo-partner-001'}`)
      .then((res) => res.json())
      .then((data) => { if (data.success && data.data) setCommissions(data.data.recentActivity?.commissions || []); else setError(data.message); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.rejected')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <motion.div variants={containerVariants} initial="hidden" animate="visible"><Skeleton className="h-64 w-full rounded-xl" /></motion.div>;
  if (error) return <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-500" /><p>{error}</p></div><Button className="mt-4" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />{t('common.retry')}</Button></CardContent></Card>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Percent className="h-6 w-6 text-emerald-600" />{t('partner.commissions') || 'Commissions'}</h2>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" />{t('partner.commissionHistory')}</CardTitle><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{commissions.length} {t('common.total')}</Badge></div></CardHeader>
          <CardContent className="p-0">
            {commissions.length === 0 ? <div className="text-center py-12"><DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t('partner.noCommissions')}</p></div> :
            <Table><TableHeader><TableRow className="bg-emerald-50/50"><TableHead>ID</TableHead><TableHead>{t('financial.amount')}</TableHead><TableHead>{t('common.status')}</TableHead><TableHead>{t('common.createdAt')}</TableHead></TableRow></TableHeader>
            <TableBody>{commissions.map((c) => <TableRow key={c.id}><TableCell className="font-medium">{c.id.slice(0,8)}</TableCell><TableCell className="font-semibold">{formatCurrency(c.amount)}</TableCell><TableCell>{statusBadge(c.status)}</TableCell><TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell></TableRow>)}</TableBody></Table>}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
