'use client';

import { useState, useEffect } from 'react';
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
  Bell,
  Inbox,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

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

// ── Types for API data ──
interface DashboardQuote {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  proposals?: { id: string; title: string; totalAmount: number | null; status: string }[];
}

interface DashboardPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  proposal?: { id: string; title: string; totalAmount: number | null; status: string };
}

interface DashboardTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  _count?: { replies: number };
}

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardData {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    phone: string | null;
  };
  stats: {
    totalQuotes: number;
    totalPayments: number;
    totalTickets: number;
    unreadNotifications: number;
  };
  recentActivity: {
    quotes: DashboardQuote[];
    payments: DashboardPayment[];
    tickets: DashboardTicket[];
    notifications: DashboardNotification[];
  };
}

export function UserDashboard() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    apiFetch(`/api/dashboard?role=user&userId=${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return safeJson(res);
      })
      .then((json) => {
        if (!json) { setError('Server returned non-JSON response'); return; }
        if (json.success && json.data) {
          setData(json.data as DashboardData);
        } else {
          setError(json.message || 'Failed to load dashboard data');
        }
      })
      .catch((err) => {
        setError(err.message || 'Network error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id]);

  const quotes = data?.recentActivity.quotes ?? [];
  const payments = data?.recentActivity.payments ?? [];
  const tickets = data?.recentActivity.tickets ?? [];
  const notifications = data?.recentActivity.notifications ?? [];

  const totalQuotes = data?.stats.totalQuotes ?? 0;
  const totalPaymentsCount = data?.stats.totalPayments ?? 0;
  const totalTicketsCount = data?.stats.totalTickets ?? 0;
  const unreadNotifications = data?.stats.unreadNotifications ?? 0;

  const approvedQuotes = quotes.filter((q) => q.status === 'accepted' || q.status === 'approved').length;
  const confirmedPayments = payments.filter((p) => p.status === 'confirmed').length;
  const openTickets = tickets.filter((tk) => tk.status === 'open' || tk.status === 'in_progress').length;
  const totalPaymentsAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
      case 'confirmed':
      case 'resolved':
      case 'closed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'pending':
      case 'open':
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
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
      description: `${approvedQuotes} ${t('common.approved')}`,
    },
    {
      icon: CreditCard,
      label: t('dashboard.payments'),
      value: formatCurrency(totalPaymentsAmount),
      accent: 'green',
      description: `${confirmedPayments} ${t('financial.paymentSuccess')}`,
    },
    {
      icon: HeadphonesIcon,
      label: t('dashboard.support'),
      value: openTickets,
      accent: 'teal',
      description: `${totalTicketsCount} ${t('common.total')}`,
    },
  ];

  const quickActions = [
    { icon: FileText, label: t('dashboard.quoteRequest'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { icon: CreditCard, label: t('dashboard.paymentHistory'), color: 'bg-green-600 hover:bg-green-700' },
    { icon: HeadphonesIcon, label: t('dashboard.supportCreate'), color: 'bg-teal-600 hover:bg-teal-700' },
  ];

  // ── Loading skeletons ──
  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <Card className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 border-0 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full bg-white/20" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
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
                <h3 className="font-semibold text-red-700">Failed to load dashboard</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setError(null);
                setLoading(true);
                apiFetch(`/api/dashboard?role=user&userId=${user?.id}`)
                  .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return safeJson(res);
                  })
                  .then((json) => {
                    if (!json) { setError('Server returned non-JSON response'); return; }
                    if (json.success && json.data) setData(json.data as DashboardData);
                    else setError(json.message || 'Failed to load');
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
      {/* ── Welcome Section ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 border-0 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-yellow-400 shadow-lg">
                <AvatarFallback className="bg-emerald-600 text-white text-lg font-bold">
                  {data?.user?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {t('dashboard.welcome', { name: data?.user?.name || user?.name || 'Utilizador' })}
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
                {quotes.length === 0 ? (
                  <div className="text-center py-8">
                    <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t('common.noData') || 'No quotes yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {quotes.slice(0, 3).map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{quote.title}</p>
                            <p className="text-xs text-muted-foreground">{quote.id.slice(0, 8)} · {formatDate(quote.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {quote.proposals?.[0]?.totalAmount && (
                            <p className="font-semibold text-sm">{formatCurrency(quote.proposals[0].totalAmount)}</p>
                          )}
                          {statusBadge(quote.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t('common.noData') || 'No payments yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {payment.proposal?.title || `Payment ${payment.id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{methodLabel(payment.method)} · {formatDate(payment.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                          {statusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                      {data?.user?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('auth.fullName')}:</span>
                      <span className="font-medium">{data?.user?.name || user?.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('auth.email')}:</span>
                      <span className="font-medium">{data?.user?.email || user?.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('auth.phone')}:</span>
                      <span className="font-medium">{data?.user?.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('dashboard.notifications') || 'Notifications'}:</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {unreadNotifications} unread
                      </Badge>
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
                {quotes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No quotes found'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('dashboard.quoteRequest') || 'Request your first quote'}</p>
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
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
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
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No payments found'}</p>
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
                          <TableCell>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                              {methodLabel(payment.method)}
                            </Badge>
                          </TableCell>
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
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <HeadphonesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData') || 'No support tickets found'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('dashboard.supportCreate') || 'Create your first ticket'}</p>
                  </div>
                ) : (
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
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id.slice(0, 8)}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>{statusBadge(ticket.status)}</TableCell>
                          <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
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
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
