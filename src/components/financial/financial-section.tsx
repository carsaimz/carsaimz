'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CreditCard,
  Receipt,
  Download,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  Building2,
  BanknoteIcon,
  Send,
  ArrowRight,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

// ── Animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ── Types for API data ──
interface ApiQuote {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  proposals: {
    id: string;
    title: string;
    description: string | null;
    totalAmount: number | null;
    status: string;
    validUntil: string | null;
    createdAt: string;
  }[];
}

interface ApiProposal {
  id: string;
  title: string;
  description: string | null;
  totalAmount: number | null;
  status: string;
  validUntil: string | null;
  createdAt: string;
  quote: {
    id: string;
    title: string;
    userId: string;
  };
}

interface ApiPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  proposal: {
    id: string;
    title: string;
    description: string | null;
    totalAmount: number | null;
    status: string;
    createdAt: string;
    quote: {
      id: string;
      title: string;
      status: string;
    };
  } | null;
}

interface ApiInvoice {
  id: string;
  number: string;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  proposal: {
    id: string;
    title: string;
    quote: {
      id: string;
      title: string;
      userId: string;
    };
  };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export function FinancialSection() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('quotes');
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [newQuoteService, setNewQuoteService] = useState('');
  const [newQuoteDescription, setNewQuoteDescription] = useState('');
  const [newQuoteBudget, setNewQuoteBudget] = useState('');

  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      apiFetch(`/api/quotes?userId=${user.id}`).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error('Quotes: Server returned non-JSON response');
        return data;
      }),
      apiFetch(`/api/payments?userId=${user.id}`).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error('Payments: Server returned non-JSON response');
        return data;
      }),
      apiFetch(`/api/invoices?userId=${user.id}`).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error('Invoices: Server returned non-JSON response');
        return data;
      }),
    ])
      .then(([quotesJson, paymentsJson, invoicesJson]) => {
        if (quotesJson.success) setQuotes(quotesJson.data || []);
        if (paymentsJson.success) setPayments(paymentsJson.data || []);
        if (invoicesJson.success) setInvoices(invoicesJson.data || []);
      })
      .catch((err) => {
        setError(err.message || 'Network error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id]);

  // Derive proposals from quotes
  const proposals: ApiProposal[] = quotes.flatMap((q) =>
    q.proposals.map((p) => ({
      ...p,
      quote: { id: q.id, title: q.title, userId: q.id },
    }))
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'accepted':
      case 'confirmed':
      case 'paid':
      case 'resolved':
      case 'closed':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">{t('common.approved')}</Badge>;
      case 'pending':
      case 'sent':
      case 'open':
      case 'in_progress':
      case 'issued':
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.rejected')}</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">{t('financial.invoiceOverdue')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const methodBadge = (method: string) => {
    switch (method) {
      case 'mpesa':
        return (
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50">
            <Phone className="h-3 w-3 mr-1" />
            {t('financial.mpesa')}
          </Badge>
        );
      case 'transfer':
        return (
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50">
            <Building2 className="h-3 w-3 mr-1" />
            {t('financial.transfer')}
          </Badge>
        );
      case 'deposit':
        return (
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50">
            <BanknoteIcon className="h-3 w-3 mr-1" />
            Deposit
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const handleSubmitQuote = async () => {
    if (!user?.id || !newQuoteService) return;

    setSubmittingQuote(true);
    try {
      const res = await apiFetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newQuoteService,
          description: newQuoteDescription,
        }),
      });

      const json = await safeJson(res);
      if (!json) return;
      if (json.success) {
        // Refresh quotes list
        const quotesRes = await apiFetch(`/api/quotes?userId=${user.id}`);
        const quotesJson = await safeJson(quotesRes);
        if (!quotesJson) return;
        if (quotesJson.success) setQuotes(quotesJson.data || []);

        setQuoteDialogOpen(false);
        setNewQuoteService('');
        setNewQuoteDescription('');
        setNewQuoteBudget('');
      }
    } catch (err) {
      console.error('Failed to submit quote:', err);
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Summary stats from real data
  const totalQuotesValue = proposals.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalPaymentsValue = payments.reduce((s, p) => s + p.amount, 0);
  const totalInvoicesValue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length;
  const acceptedProposals = proposals.filter((p) => p.status === 'accepted').length;
  const confirmedPayments = payments.filter((p) => p.status === 'confirmed').length;

  // ── Loading skeletons ──
  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700">
              <CardContent className="p-4 sm:p-5">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Failed to load financial data</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setError(null);
                setLoading(true);
                Promise.all([
                  apiFetch(`/api/quotes?userId=${user?.id}`).then((r) => safeJson(r)),
                  apiFetch(`/api/payments?userId=${user?.id}`).then((r) => safeJson(r)),
                  apiFetch(`/api/invoices?userId=${user?.id}`).then((r) => safeJson(r)),
                ])
                  .then(([q, p, i]) => {
                    if (!q || !p || !i) { setError('Server returned non-JSON response'); return; }
                    if (q.success) setQuotes(q.data || []);
                    if (p.success) setPayments(p.data || []);
                    if (i.success) setInvoices(i.data || []);
                  })
                  .catch((err) => setError(err.message))
                  .finally(() => setLoading(false));
              }}
            >
              {t('common.retry') || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Summary Stats ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.quotes')}</p>
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalQuotesValue > 0 ? `Value: ${formatCurrency(totalQuotesValue)}` : 'No proposals yet'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('financial.proposal')}</p>
                <p className="text-2xl font-bold">{proposals.length}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{acceptedProposals} accepted</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <Send className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('financial.payment')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPaymentsValue)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{confirmedPayments} confirmed</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('financial.invoice')}</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-xs text-red-600 mt-1">{overdueInvoices} overdue</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-emerald-50 dark:bg-emerald-950/30 w-full sm:w-auto">
            <TabsTrigger value="quotes" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
              {t('dashboard.quotes')}
            </TabsTrigger>
            <TabsTrigger value="proposals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
              {t('financial.proposal')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
              {t('financial.payment')}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
              {t('financial.invoice')}
            </TabsTrigger>
          </TabsList>

          {/* ── Quotes Tab ── */}
          <TabsContent value="quotes" className="space-y-4 mt-4">
            {/* Request New Quote */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    {t('financial.quoteRequestTitle')}
                  </CardTitle>
                </div>
                <CardDescription>{t('financial.quoteRequestDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.quoteRequest')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('financial.quoteRequestTitle')}</DialogTitle>
                      <DialogDescription>{t('financial.quoteRequestDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('services.title')}</Label>
                        <Select value={newQuoteService} onValueChange={setNewQuoteService}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="web-dev">{t('services.webDev')}</SelectItem>
                            <SelectItem value="mobile-dev">{t('services.mobileDev')}</SelectItem>
                            <SelectItem value="cloud">{t('services.cloud')}</SelectItem>
                            <SelectItem value="ai">{t('services.ai')}</SelectItem>
                            <SelectItem value="consulting">{t('services.consulting')}</SelectItem>
                            <SelectItem value="design">{t('services.design')}</SelectItem>
                            <SelectItem value="seo">{t('services.seo')}</SelectItem>
                            <SelectItem value="maintenance">{t('services.maintenance')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('financial.description')}</Label>
                        <Textarea
                          value={newQuoteDescription}
                          onChange={(e) => setNewQuoteDescription(e.target.value)}
                          placeholder="Describe your requirements..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('financial.amount')} ({t('financial.currency')})</Label>
                        <Input
                          type="number"
                          value={newQuoteBudget}
                          onChange={(e) => setNewQuoteBudget(e.target.value)}
                          placeholder="Estimated budget in MT"
                        />
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleSubmitQuote}
                        disabled={submittingQuote || !newQuoteService}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {submittingQuote ? 'Submitting...' : t('common.confirm')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Existing Quotes List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('dashboard.quotesHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quotes.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No quotes found'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('financial.quoteRequestDesc') || 'Request your first quote'}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t('financial.item')}</TableHead>
                        <TableHead>{t('financial.description')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('common.createdAt')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.id.slice(0, 8)}</TableCell>
                          <TableCell>{quote.title}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{quote.description || '—'}</TableCell>
                          <TableCell>{statusBadge(quote.status)}</TableCell>
                          <TableCell>{formatDate(quote.createdAt)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Proposals Tab ── */}
          <TabsContent value="proposals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('financial.proposal')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposals.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No proposals yet'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Proposals are created when quotes are reviewed</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Quote</TableHead>
                        <TableHead>{t('common.details')}</TableHead>
                        <TableHead>{t('financial.amount')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('common.createdAt')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">{proposal.id.slice(0, 8)}</TableCell>
                          <TableCell>{proposal.quote.title}</TableCell>
                          <TableCell>{proposal.title}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(proposal.totalAmount || 0)}</TableCell>
                          <TableCell>{statusBadge(proposal.status)}</TableCell>
                          <TableCell>{formatDate(proposal.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {proposal.status === 'sent' && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payments Tab ── */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            {/* Payment Methods Info */}
            <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700">
              <CardHeader>
                <CardTitle className="text-lg">{t('financial.paymentMethod')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-semibold">{t('financial.mpesa')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{t('financial.mpesaPay')}</p>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">Instant</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-semibold">{t('financial.transfer')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Direct bank transfer</p>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">1-2 days</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <BanknoteIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-semibold">Deposit</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Cash deposit at bank</p>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">Same day</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('dashboard.paymentHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No payments found'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Payments are linked to accepted proposals</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t('financial.description')}</TableHead>
                        <TableHead>{t('financial.paymentMethod')}</TableHead>
                        <TableHead>{t('financial.amount')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('common.createdAt')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id.slice(0, 8)}</TableCell>
                          <TableCell>{payment.proposal?.title || `Payment ${payment.id.slice(0, 8)}`}</TableCell>
                          <TableCell>{methodBadge(payment.method)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{statusBadge(payment.status)}</TableCell>
                          <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Invoices Tab ── */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('financial.invoice')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No invoices found'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Invoices are generated from accepted proposals</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('financial.invoiceNumber')}</TableHead>
                        <TableHead>Proposal</TableHead>
                        <TableHead>{t('financial.amount')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('financial.invoiceDate')}</TableHead>
                        <TableHead>{t('financial.invoiceDueDate')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.number}</TableCell>
                          <TableCell>{invoice.proposal?.title || '—'}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                          <TableCell>{statusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                          <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                                <Download className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
