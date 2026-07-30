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
import { apiFetch, safeJson } from '@/lib/api-fetch';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface SupportData { id: string; subject: string; status: string; priority?: string; createdAt: string; }

export function UserSupport() {
  const { t, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  const fetchTickets = async () => {
    if (!user?.id) {
      setError('Inicie sessão para ver os seus tickets.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/support?userId=${user.id}`);
      const data = await safeJson(res);
      if (!data) { setError(t('common.serverNonJson')); return; }
      if (data.success) setTickets(data.data || []);
      else setError(data.message || 'Falha ao carregar tickets.');
    } catch (err: any) {
      setError(err.message || t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [user?.id]);

  const handleCreateTicket = async () => {
    if (!user?.id || !newSubject.trim() || !newMessage.trim()) return;

    try {
      setCreating(true);
      const res = await apiFetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: newSubject.trim(),
          message: newMessage.trim(),
          priority: newPriority,
        }),
      });

      const data = await safeJson(res);
      if (data?.success) {
        setShowCreateForm(false);
        setNewSubject('');
        setNewMessage('');
        setNewPriority('medium');
        fetchTickets(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'resolved': case 'closed': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.resolved')}</Badge>;
      case 'open': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.open')}</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{t('common.inProgress')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const priorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high': case 'urgent': return <Badge className="bg-red-100 text-red-700 border-red-200">Alta</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Baixa</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Média</Badge>;
    }
  };

  if (loading) return <motion.div variants={containerVariants} initial="hidden" animate="visible"><Skeleton className="h-64 w-full rounded-xl" /></motion.div>;
  if (error) return <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-500" /><p>{error}</p></div><Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={fetchTickets}><RefreshCw className="mr-2 h-4 w-4" />{t('common.retry')}</Button></CardContent></Card>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Headphones className="h-6 w-6 text-emerald-600" />{t('dashboard.support')}</h2>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancelar' : t('dashboard.supportCreate')}
          </Button>
        </div>
      </motion.div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Novo Ticket de Suporte</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assunto</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Descreva o problema brevemente..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  placeholder="Explique o problema em detalhe..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreateTicket}
                  disabled={creating || !newSubject.trim() || !newMessage.trim()}
                >
                  {creating ? 'A criar...' : 'Criar Ticket'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-0">
          {tickets.length === 0 ? <div className="text-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t('dashboard.noTickets')}</p><p className="text-sm text-muted-foreground mt-1">{t('dashboard.createTicketHelp')}</p></div> :
          <Table><TableHeader><TableRow className="bg-emerald-50/50"><TableHead>{t('contact.subject')}</TableHead><TableHead>Status</TableHead><TableHead>Prioridade</TableHead><TableHead>{t('common.date')}</TableHead></TableRow></TableHeader>
          <TableBody>{tickets.map((ticket) => <TableRow key={ticket.id}><TableCell className="font-medium">{ticket.subject}</TableCell><TableCell>{statusBadge(ticket.status)}</TableCell><TableCell>{priorityBadge(ticket.priority)}</TableCell><TableCell className="text-muted-foreground">{formatDate(ticket.createdAt)}</TableCell></TableRow>)}</TableBody></Table>}
        </CardContent></Card>
      </motion.div>
    </motion.div>
  );
}
