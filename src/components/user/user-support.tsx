'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Headphones, AlertCircle, RefreshCw, Plus, MessageSquare } from 'lucide-react';
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

interface SupportData { id: string; subject: string; status: string; createdAt: string; }

export function UserSupport() {
  const { t, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/support?userId=${user?.id || 'demo-user-001'}`)
      .then((res) => res.json())
      .then((data) => { if (data.success) setTickets(data.data || []); else setError(data.message); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'resolved': case 'closed': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Resolved</Badge>;
      case 'open': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Open</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">In Progress</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <motion.div variants={containerVariants} initial="hidden" animate="visible"><Skeleton className="h-64 w-full rounded-xl" /></motion.div>;
  if (error) return <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-500" /><p>{error}</p></div><Button className="mt-4" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />{t('common.retry')}</Button></CardContent></Card>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Headphones className="h-6 w-6 text-emerald-600" />{t('dashboard.support') || 'Support Tickets'}</h2>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-0">
          {tickets.length === 0 ? <div className="text-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No support tickets</p><p className="text-sm text-muted-foreground mt-1">Create a new ticket if you need help</p></div> :
          <Table><TableHeader><TableRow className="bg-emerald-50/50"><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>{tickets.map((ticket) => <TableRow key={ticket.id}><TableCell className="font-medium">{ticket.subject}</TableCell><TableCell>{statusBadge(ticket.status)}</TableCell><TableCell className="text-muted-foreground">{formatDate(ticket.createdAt)}</TableCell></TableRow>)}</TableBody></Table>}
        </CardContent></Card>
      </motion.div>
    </motion.div>
  );
}
