'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CreditCard,
  HeadphonesIcon,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Download,
  MessageSquare,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';

// ── Animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Mock data ──
const mockQuotes = [
  { id: 'Q-001', service: 'Website Development', amount: 75000, status: 'approved', date: '2025-01-15' },
  { id: 'Q-002', service: 'Mobile App', amount: 150000, status: 'pending', date: '2025-02-20' },
  { id: 'Q-003', service: 'Cloud Infrastructure', amount: 45000, status: 'rejected', date: '2025-03-10' },
  { id: 'Q-004', service: 'SEO Optimization', amount: 25000, status: 'approved', date: '2025-04-05' },
  { id: 'Q-005', service: 'AI Integration', amount: 120000, status: 'pending', date: '2025-05-01' },
];

const mockPayments = [
  { id: 'P-001', description: 'Website Development - Phase 1', amount: 37500, method: 'mpesa', status: 'confirmed', date: '2025-01-20' },
  { id: 'P-002', description: 'SEO Package - Monthly', amount: 25000, method: 'transfer', status: 'confirmed', date: '2025-04-10' },
  { id: 'P-003', description: 'Mobile App - Deposit', amount: 50000, method: 'deposit', status: 'pending', date: '2025-02-25' },
  { id: 'P-004', description: 'Cloud Services - Setup', amount: 22500, method: 'mpesa', status: 'confirmed', date: '2025-03-15' },
];

const mockTickets = [
  { id: 'ST-001', subject: 'Cannot access dashboard', status: 'resolved', priority: 'high', date: '2025-01-08' },
  { id: 'ST-002', subject: 'Payment confirmation delay', status: 'open', priority: 'medium', date: '2025-04-12' },
  { id: 'ST-003', subject: 'Quote pricing question', status: 'open', priority: 'low', date: '2025-05-05' },
];

export function UserDashboard() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('overview');

  const totalQuotes = mockQuotes.length;
  const totalPayments = mockPayments.reduce((sum, p) => sum + p.amount, 0);
  const openTickets = mockTickets.filter((tk) => tk.status === 'open').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'resolved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'pending':
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.required')}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{priority}</Badge>;
      case 'low':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const methodLabel = (method: string) => {
    switch (method) {
      case 'mpesa':
        return t('financial.mpesa');
      case 'transfer':
        return t('financial.transfer');
      case 'deposit':
        return 'Deposit';
      default:
        return method;
    }
  };

  const statsCards = [
    {
      icon: FileText,
      label: t('dashboard.quotes'),
      value: totalQuotes,
      accent: 'emerald',
      description: `${mockQuotes.filter(q => q.status === 'approved').length} ${t('common.approved')}`,
    },
    {
      icon: CreditCard,
      label: t('dashboard.payments'),
      value: formatCurrency(totalPayments),
      accent: 'green',
      description: `${mockPayments.filter(p => p.status === 'confirmed').length} ${t('financial.paymentSuccess')}`,
    },
    {
      icon: HeadphonesIcon,
      label: t('dashboard.support'),
      value: openTickets,
      accent: 'teal',
      description: `${mockTickets.length} ${t('common.total')}`,
    },
  ];

  const quickActions = [
    { icon: FileText, label: t('dashboard.quoteRequest'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { icon: CreditCard, label: t('dashboard.paymentHistory'), color: 'bg-green-600 hover:bg-green-700' },
    { icon: HeadphonesIcon, label: t('dashboard.supportCreate'), color: 'bg-teal-600 hover:bg-teal-700' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Welcome Section ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 border-0 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-yellow-400 shadow-lg">
                <AvatarFallback className="bg-emerald-600 text-white text-lg font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {t('dashboard.welcome', { name: user?.name || 'Utilizador' })}
                </h1>
                <p className="text-emerald-200 mt-1">
                  {t('dashboard.lastLogin', { date: formatDate(new Date()) })}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-emerald-200">{t('partner.tierSilver')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{stat.description}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  className={`${action.color} text-white rounded-xl h-12 font-semibold shadow-sm transition-all`}
                >
                  <action.icon className="h-5 w-5 mr-2" />
                  {action.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Content Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto bg-emerald-50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {t('dashboard.overview')}
            </TabsTrigger>
            <TabsTrigger value="quotes" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {t('dashboard.quotes')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {t('dashboard.payments')}
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {t('dashboard.support')}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Recent Quotes Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.quotesHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {mockQuotes.slice(0, 3).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{quote.service}</p>
                          <p className="text-xs text-muted-foreground">{quote.id} · {formatDate(quote.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(quote.amount)}</p>
                        {statusBadge(quote.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.paymentHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {mockPayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">{methodLabel(payment.method)} · {formatDate(payment.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                        {statusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.profile')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-emerald-500">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('auth.fullName')}:</span>
                      <span className="font-medium">{user?.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('auth.email')}:</span>
                      <span className="font-medium">{user?.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('auth.phone')}:</span>
                      <span className="font-medium">+258 84 XXX XXX</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('dashboard.location')}:</span>
                      <span className="font-medium">Maputo, Moçambique</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('dashboard.company')}:</span>
                      <span className="font-medium">Empresa XYZ</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('partner.tier')}:</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('partner.tierSilver')}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Quotes Tab ── */}
          <TabsContent value="quotes" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    {t('dashboard.quotesHistory')}
                  </CardTitle>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('dashboard.quoteRequest')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('financial.item')}</TableHead>
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

          {/* ── Payments Tab ── */}
          <TabsContent value="payments" className="mt-4">
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
                        <TableCell>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                            {methodLabel(payment.method)}
                          </Badge>
                        </TableCell>
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

          {/* ── Support Tab ── */}
          <TabsContent value="support" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HeadphonesIcon className="h-5 w-5 text-emerald-600" />
                    {t('dashboard.supportHistory')}
                  </CardTitle>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('dashboard.supportCreate')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('contact.subject')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>{t('common.createdAt')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>{statusBadge(ticket.status)}</TableCell>
                        <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{formatDate(ticket.date)}</TableCell>
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
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
