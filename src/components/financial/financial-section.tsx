'use client';

import { useState } from 'react';
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
import { useLanguage } from '@/contexts/language-context';

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Mock data ──
const mockQuotes = [
  { id: 'Q-001', service: 'Website Development', description: 'Corporate website with 10 pages', amount: 75000, status: 'approved', date: '2025-01-15', validUntil: '2025-02-15' },
  { id: 'Q-002', service: 'Mobile App Development', description: 'Android/iOS app for banking', amount: 150000, status: 'pending', date: '2025-02-20', validUntil: '2025-03-20' },
  { id: 'Q-003', service: 'Cloud Infrastructure', description: 'AWS setup and monitoring', amount: 45000, status: 'rejected', date: '2025-03-10', validUntil: '2025-04-10' },
  { id: 'Q-004', service: 'SEO & Marketing', description: '6-month SEO campaign', amount: 25000, status: 'approved', date: '2025-04-05', validUntil: '2025-05-05' },
  { id: 'Q-005', service: 'AI Integration', description: 'Chatbot and analytics AI', amount: 120000, status: 'pending', date: '2025-05-01', validUntil: '2025-06-01' },
  { id: 'Q-006', service: 'UI/UX Design', description: 'App redesign and prototyping', amount: 35000, status: 'approved', date: '2025-05-20', validUntil: '2025-06-20' },
];

const mockProposals = [
  { id: 'P-001', client: 'Empresa Alpha', title: 'E-commerce Solution', amount: 85000, status: 'sent', date: '2025-01-18' },
  { id: 'P-002', client: 'Beta Solutions', title: 'Mobile Banking Platform', amount: 160000, status: 'accepted', date: '2025-02-22' },
  { id: 'P-003', client: 'Gamma Corp', title: 'Cloud Migration Plan', amount: 50000, status: 'rejected', date: '2025-03-12' },
  { id: 'P-004', client: 'Delta Services', title: 'Digital Marketing Package', amount: 28000, status: 'sent', date: '2025-04-08' },
  { id: 'P-005', client: 'Omega Ltd', title: 'AI Analytics Suite', amount: 130000, status: 'accepted', date: '2025-05-03' },
];

const mockPayments = [
  { id: 'PAY-001', description: 'Website Dev - Phase 1', amount: 37500, method: 'mpesa', status: 'confirmed', date: '2025-01-20' },
  { id: 'PAY-002', description: 'SEO Package - Monthly', amount: 25000, method: 'transfer', status: 'confirmed', date: '2025-04-10' },
  { id: 'PAY-003', description: 'Mobile App - Deposit', amount: 50000, method: 'deposit', status: 'pending', date: '2025-02-25' },
  { id: 'PAY-004', description: 'Cloud Setup - Initial', amount: 22500, method: 'mpesa', status: 'confirmed', date: '2025-03-15' },
  { id: 'PAY-005', description: 'UI/UX Design - Milestone', amount: 17500, method: 'transfer', status: 'confirmed', date: '2025-05-25' },
];

const mockInvoices = [
  { id: 'INV-001', client: 'Empresa Alpha', amount: 75000, status: 'paid', date: '2025-01-20', dueDate: '2025-02-20' },
  { id: 'INV-002', client: 'Beta Solutions', amount: 50000, status: 'paid', date: '2025-02-25', dueDate: '2025-03-25' },
  { id: 'INV-003', client: 'Delta Services', amount: 25000, status: 'unpaid', date: '2025-04-10', dueDate: '2025-05-10' },
  { id: 'INV-004', client: 'Gamma Corp', amount: 45000, status: 'overdue', date: '2025-03-15', dueDate: '2025-04-15' },
  { id: 'INV-005', client: 'Omega Ltd', amount: 120000, status: 'unpaid', date: '2025-05-01', dueDate: '2025-06-01' },
];

export function FinancialSection() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const [activeTab, setActiveTab] = useState('quotes');
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [newQuoteService, setNewQuoteService] = useState('');
  const [newQuoteDescription, setNewQuoteDescription] = useState('');
  const [newQuoteBudget, setNewQuoteBudget] = useState('');

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'paid':
      case 'accepted':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'pending':
      case 'sent':
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'rejected':
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
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            <Phone className="h-3 w-3 mr-1" />
            {t('financial.mpesa')}
          </Badge>
        );
      case 'transfer':
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            <Building2 className="h-3 w-3 mr-1" />
            {t('financial.transfer')}
          </Badge>
        );
      case 'deposit':
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            <BanknoteIcon className="h-3 w-3 mr-1" />
            Deposit
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const handleSubmitQuote = () => {
    // Mock submit — just close the dialog
    setQuoteDialogOpen(false);
    setNewQuoteService('');
    setNewQuoteDescription('');
    setNewQuoteBudget('');
  };

  // Summary stats
  const totalQuotesValue = mockQuotes.reduce((s, q) => s + q.amount, 0);
  const totalPaymentsValue = mockPayments.reduce((s, p) => s + p.amount, 0);
  const totalInvoicesValue = mockInvoices.reduce((s, i) => s + i.amount, 0);
  const overdueInvoices = mockInvoices.filter(i => i.status === 'overdue').length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Summary Stats ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.quotes')}</p>
                <p className="text-2xl font-bold">{mockQuotes.length}</p>
                <p className="text-xs text-emerald-600 mt-1">Value: {formatCurrency(totalQuotesValue)}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('financial.proposal')}</p>
                <p className="text-2xl font-bold">{mockProposals.length}</p>
                <p className="text-xs text-emerald-600 mt-1">2 accepted</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Send className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('financial.payment')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPaymentsValue)}</p>
                <p className="text-xs text-emerald-600 mt-1">4 confirmed</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('financial.invoice')}</p>
                <p className="text-2xl font-bold">{mockInvoices.length}</p>
                <p className="text-xs text-red-600 mt-1">{overdueInvoices} overdue</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-emerald-50 w-full sm:w-auto">
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
                    <Plus className="h-5 w-5 text-emerald-600" />
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
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmitQuote}>
                        <Send className="h-4 w-4 mr-2" />
                        {t('common.confirm')}
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
                  <FileText className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.quotesHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('financial.item')}</TableHead>
                      <TableHead>{t('financial.description')}</TableHead>
                      <TableHead>{t('financial.amount')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead>{t('common.createdAt')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockQuotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.id}</TableCell>
                        <TableCell>{quote.service}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{quote.description}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(quote.amount)}</TableCell>
                        <TableCell>{statusBadge(quote.status)}</TableCell>
                        <TableCell>{formatDate(quote.date)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Proposals Tab ── */}
          <TabsContent value="proposals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-emerald-600" />
                  {t('financial.proposal')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>{t('common.details')}</TableHead>
                      <TableHead>{t('financial.amount')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead>{t('common.createdAt')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">{proposal.id}</TableCell>
                        <TableCell>{proposal.client}</TableCell>
                        <TableCell>{proposal.title}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(proposal.amount)}</TableCell>
                        <TableCell>{statusBadge(proposal.status)}</TableCell>
                        <TableCell>{formatDate(proposal.date)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-emerald-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {proposal.status === 'sent' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-emerald-600">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payments Tab ── */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            {/* Payment Methods Info */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg">{t('financial.paymentMethod')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold">{t('financial.mpesa')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{t('financial.mpesaPay')}</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Instant</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold">{t('financial.transfer')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Direct bank transfer</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">1-2 days</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <BanknoteIcon className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold">Deposit</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Cash deposit at bank</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Same day</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.paymentHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                    {mockPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell>{methodBadge(payment.method)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{statusBadge(payment.status)}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Invoices Tab ── */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  {t('financial.invoice')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('financial.invoiceNumber')}</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>{t('financial.amount')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead>{t('financial.invoiceDate')}</TableHead>
                      <TableHead>{t('financial.invoiceDueDate')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{statusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
