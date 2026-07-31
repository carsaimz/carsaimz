'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  Headphones, Eye, Pencil, Trash2, MessageSquare, Send, Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface TicketReply {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  author?: { id: string; name: string; email: string; avatar?: string };
}

interface SupportTicket {
  id: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string };
  replies?: TicketReply[];
}

export function AdminSupportManager() {
  const { t, formatDate } = useLanguage();
  useDocumentTitle('admin.support', 'Suporte');
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTicket, setStatusTicket] = useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/support');
      const data = await safeJson(res);
      if (data && data.success) {
        setTickets(data.data || []);
      }
    } catch (err) {
      console.error('Support tickets fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyContent('');
    setDetailOpen(true);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setReplySending(true);
    try {
      const res = await apiFetch('/api/support/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          content: replyContent,
          authorId: user?.id || 'admin',
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Saved', description: t('admin.support') || 'Reply sent' });
        setReplyContent('');
        fetchTickets();
        // Refresh the selected ticket
        const updated = tickets.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket({ ...updated, replies: [...(updated.replies || []), data.data] });
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to send reply', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setReplySending(false);
    }
  };

  const openStatusChange = (ticket: SupportTicket) => {
    setStatusTicket(ticket);
    setNewStatus(ticket.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusTicket || !newStatus) return;
    setStatusSaving(true);
    try {
      const res = await apiFetch('/api/admin/support', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: statusTicket.id, status: newStatus }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Updated', description: t('admin.support') || 'Status updated' });
        setStatusDialogOpen(false);
        fetchTickets();
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to update status', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch(`/api/admin/support?id=${deleteId}`, { method: 'DELETE' });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.deleteItem') || 'Deleted', description: 'Ticket deleted' });
        fetchTickets();
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to delete ticket', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><AlertCircle className="h-3 w-3 mr-1" />{t('support.open') || 'Open'}</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />{t('support.inProgress') || 'In Progress'}</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="h-3 w-3 mr-1" />{t('support.resolved') || 'Resolved'}</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200"><XCircle className="h-3 w-3 mr-1" />{t('support.closed') || 'Closed'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('support.high') || 'High'}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('support.medium') || 'Medium'}</Badge>;
      case 'low':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">{t('support.low') || 'Low'}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.support') || 'Support Management'}
          </h2>
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
            {tickets.length} {t('common.total') || 'total'}
          </Badge>
        </div>
      </motion.div>

      {/* Tickets Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.support') || 'Support Tickets'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading') || 'Loading...'}</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No tickets'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.itemTitle') || 'Subject'}</TableHead>
                    <TableHead>{t('admin.name') || 'User'}</TableHead>
                    <TableHead>{t('admin.status') || 'Status'}</TableHead>
                    <TableHead>{t('support.priority') || 'Priority'}</TableHead>
                    <TableHead>{t('admin.date') || 'Date'}</TableHead>
                    <TableHead>{t('admin.actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{ticket.user?.name || ticket.userId?.slice(0, 8) || '—'}</TableCell>
                      <TableCell>{statusBadge(ticket.status)}</TableCell>
                      <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(ticket.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openDetail(ticket)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openStatusChange(ticket)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(ticket.id)}>
                            <Trash2 className="size-4" />
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

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Ticket details'}</DialogDescription>
          </DialogHeader>
          <Separator />
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {statusBadge(selectedTicket.status)}
                {priorityBadge(selectedTicket.priority)}
                <span className="text-xs text-muted-foreground">{formatDate(selectedTicket.createdAt)}</span>
              </div>
              {selectedTicket.user && (
                <div className="text-sm text-muted-foreground">
                  {t('admin.name') || 'User'}: {selectedTicket.user.name} ({selectedTicket.user.email})
                </div>
              )}
              {selectedTicket.description && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">{selectedTicket.description}</div>
              )}
              {!selectedTicket.description && (selectedTicket as any).message && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">{(selectedTicket as any).message}</div>
              )}

              {/* Replies */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">{t('support.replies') || 'Replies'} ({selectedTicket.replies.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTicket.replies.map((reply) => (
                      <div key={reply.id} className="p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{reply.author?.name || reply.authorId?.slice(0, 8) || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply form */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('support.reply') || 'Reply'}</Label>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('support.writeReply') || 'Write your reply...'}
                  rows={3}
                  className="focus-visible:ring-emerald-500"
                />
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleReply}
                  disabled={replySending || !replyContent.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {replySending ? (t('common.loading') || 'Sending...') : (t('support.sendReply') || 'Send Reply')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.editItem') || 'Change Status'}</DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Update ticket status'}</DialogDescription>
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
                  <SelectItem value="open">{t('support.open') || 'Open'}</SelectItem>
                  <SelectItem value="in_progress">{t('support.inProgress') || 'In Progress'}</SelectItem>
                  <SelectItem value="resolved">{t('support.resolved') || 'Resolved'}</SelectItem>
                  <SelectItem value="closed">{t('support.closed') || 'Closed'}</SelectItem>
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteItem') || 'Delete'}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.confirmDelete') || 'Are you sure you want to delete this item?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              {t('admin.deleteItem') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
