'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Headphones, AlertCircle, RefreshCw, Plus, MessageSquare, ArrowLeft, Send, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface ReplyAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface TicketReply {
  id: string;
  content: string;
  ticketId: string;
  authorId: string;
  author: ReplyAuthor;
  createdAt: string;
}

interface SupportData {
  id: string;
  subject: string;
  description?: string | null;
  status: string;
  priority?: string;
  createdAt: string;
  replies?: TicketReply[];
}

export function UserSupport() {
  const { t, formatDate, formatRelativeTime } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportData | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    if (!user?.id) {
      setError(t('support.loginRequired'));
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
      else setError(data.message || t('support.fetchError'));
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
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !selectedTicket || !user?.id) return;

    try {
      setSubmittingReply(true);
      const res = await apiFetch('/api/support/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          content: replyText.trim(),
          authorId: user.id,
        }),
      });
      const data = await safeJson(res);
      if (data?.success) {
        const newReply: TicketReply = {
          id: data.data.id || `reply-${Date.now()}`,
          content: replyText,
          ticketId: selectedTicket.id,
          authorId: user.id,
          author: {
            id: user.id,
            name: user.name,
            email: user.email || '',
            avatar: user.avatar,
          },
          createdAt: new Date().toISOString(),
        };
        setSelectedTicket({
          ...selectedTicket,
          replies: [...(selectedTicket.replies || []), newReply],
        });
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleViewTicket = (ticket: SupportData) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setReplyText('');
    fetchTickets();
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
      case 'high': case 'urgent': return <Badge className="bg-red-100 text-red-700 border-red-200">{t('support.high')}</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{t('support.low')}</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{t('support.medium')}</Badge>;
    }
  };

  if (loading) return <motion.div variants={containerVariants} initial="hidden" animate="visible"><Skeleton className="h-64 w-full rounded-xl" /></motion.div>;
  if (error) return <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-500" /><p>{error}</p></div><Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={fetchTickets}><RefreshCw className="mr-2 h-4 w-4" />{t('common.retry')}</Button></CardContent></Card>;

  // ─── Ticket Detail View ──────────────────────────────────────────────
  if (selectedTicket) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('nav.back') || 'Back'}
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {statusBadge(selectedTicket.status)}
                {priorityBadge(selectedTicket.priority)}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{selectedTicket.subject}</h2>
              {selectedTicket.description && (
                <p className="text-muted-foreground text-sm mb-3">{selectedTicket.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(selectedTicket.createdAt)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replies */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            {t('support.replies')} ({selectedTicket.replies?.length ?? 0})
          </h3>

          {(selectedTicket.replies?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">{t('common.noResults')}</p>
          )}

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {(selectedTicket.replies || []).map((reply) => (
              <Card key={reply.id} className="border-border/50 hover:border-emerald-200/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {reply.author?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('') || '?'}
                      </AvatarFallback>
                      {reply.author?.avatar && <AvatarImage src={reply.author.avatar} />}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">
                          {reply.author?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <Separator />

        {/* Reply form */}
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-foreground">{user?.name}</span>
              </div>
              <Textarea
                placeholder={t('support.replyPlaceholder')}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] mb-3 resize-none"
              />
              <Button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submittingReply}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submittingReply ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">...</span>
                    {t('support.sending')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t('support.sendReply')}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Ticket List View ──────────────────────────────────────────────
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Headphones className="h-6 w-6 text-emerald-600" />{t('dashboard.support')}</h2>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? t('common.cancel') : t('dashboard.supportCreate')}
          </Button>
        </div>
      </motion.div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">{t('support.newTicket')}</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('support.subject')}</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('support.subjectPlaceholder')}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('support.message')}</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  placeholder={t('support.messagePlaceholder')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('support.priority')}</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="low">{t('support.low')}</option>
                  <option value="medium">{t('support.medium')}</option>
                  <option value="high">{t('support.high')}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreateTicket}
                  disabled={creating || !newSubject.trim() || !newMessage.trim()}
                >
                  {creating ? t('support.creating') : t('support.createTicket')}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-0">
          {tickets.length === 0 ? <div className="text-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t('dashboard.noTickets')}</p><p className="text-sm text-muted-foreground mt-1">{t('dashboard.createTicketHelp')}</p></div> :
          <Table><TableHeader><TableRow className="bg-emerald-50/50"><TableHead>{t('support.subject')}</TableHead><TableHead>{t('support.status')}</TableHead><TableHead>{t('support.priority')}</TableHead><TableHead>{t('common.date')}</TableHead></TableRow></TableHeader>
          <TableBody>{tickets.map((ticket) => <TableRow key={ticket.id} className="cursor-pointer hover:bg-emerald-50/30 transition-colors" onClick={() => handleViewTicket(ticket)}><TableCell className="font-medium">{ticket.subject}</TableCell><TableCell>{statusBadge(ticket.status)}</TableCell><TableCell>{priorityBadge(ticket.priority)}</TableCell><TableCell className="text-muted-foreground">{formatDate(ticket.createdAt)}</TableCell></TableRow>)}</TableBody></Table>}
        </CardContent></Card>
      </motion.div>
    </motion.div>
  );
}
