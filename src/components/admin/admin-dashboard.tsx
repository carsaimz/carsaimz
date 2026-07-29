'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  Briefcase,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Shield,
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  AlertCircle,
  Inbox,
  CreditCard,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// ── Chart Colors (Emerald theme) ──
const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

// ── Types ──
interface StatsData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalProjects: number;
    totalServices: number;
    totalForumTopics: number;
    totalRevenue: number;
    confirmedRevenue: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
    partners: number;
    regular: number;
  };
  content?: {
    publishedPosts: number;
    categories: number;
    tags: number;
    recentPosts: number;
  };
  projects?: {
    total: number;
    featured: number;
  };
  services?: {
    total: number;
    featured: number;
  };
  forum?: {
    topics: number;
    pinned: number;
    resolved: number;
  };
  payments: {
    total: number;
    totalRevenue: number;
    confirmedRevenue: number;
    mpesa: number;
    transfer: number;
    deposit: number;
  };
  notifications?: {
    total: number;
    unread: number;
  };
  support?: {
    totalTickets: number;
    openTickets: number;
  };
}

interface HistoryData {
  revenue: { month: string; revenue: number; target: number }[];
  usersGrowth: { month: string; newUsers: number; totalUsers: number }[];
  postsByCategory: { name: string; value: number }[];
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

interface RecentQuote {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface RecentPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  proposal: { id: string; title: string } | null;
}

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface RecentPost {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; name: string };
  _count: { comments: number };
}

interface DashboardData {
  role: string;
  stats: {
    totalUsers: number;
    totalPosts: number;
    totalQuotes: number;
    totalPayments: number;
    totalTickets: number;
    totalForumTopics: number;
    totalRevenue: number;
  };
  breakdowns: {
    quotes: { status: string; count: number }[];
    payments: { status: string; count: number; total: number }[];
    tickets: { status: string; count: number }[];
  };
  recentActivity: {
    users: RecentUser[];
    quotes: RecentQuote[];
    payments: RecentPayment[];
    tickets: RecentTicket[];
    posts: RecentPost[];
  };
}

export function AdminDashboard() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Use Promise.allSettled so each API call is independent —
    // if one fails, the others still load their data.
    Promise.allSettled([
      apiFetch('/api/stats').then(async (res) => {
        if (!res.ok) throw new Error(`Stats: HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error(t('common.serverNonJson'));
        return data;
      }),
      apiFetch('/api/stats/history').then(async (res) => {
        if (!res.ok) throw new Error(`History: HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error(t('common.serverNonJson'));
        return data;
      }),
      apiFetch(`/api/dashboard?role=${user?.role || 'admin'}&userId=${user.id}`).then(async (res) => {
        if (!res.ok) throw new Error(`Dashboard: HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error(t('common.serverNonJson'));
        return data;
      }),
    ])
      .then(([statsResult, historyResult, dashboardResult]) => {
        const errors: string[] = [];

        if (statsResult.status === 'fulfilled' && statsResult.value?.success && statsResult.value?.data) {
          setStats(statsResult.value.data as StatsData);
        } else if (statsResult.status === 'rejected') {
          errors.push(statsResult.reason?.message || 'Stats failed');
        }

        if (historyResult.status === 'fulfilled' && historyResult.value?.success && historyResult.value?.data) {
          setHistory(historyResult.value.data as HistoryData);
        } else if (historyResult.status === 'rejected') {
          errors.push(historyResult.reason?.message || 'History failed');
        }

        if (dashboardResult.status === 'fulfilled' && dashboardResult.value?.success && dashboardResult.value?.data) {
          setDashboardData(dashboardResult.value.data as DashboardData);
        } else if (dashboardResult.status === 'rejected') {
          errors.push(dashboardResult.reason?.message || 'Dashboard failed');
        }

        // Only show error if ALL three failed
        if (errors.length === 3) {
          setError(errors.join('; '));
        } else if (errors.length > 0) {
          console.warn('[AdminDashboard] Partial API failures:', errors);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id]);

  const totalUsers = stats?.users.total ?? 0;
  const totalPosts = stats?.overview.totalPosts ?? 0;
  const totalProjects = stats?.overview.totalProjects ?? 0;
  const totalRevenue = stats?.overview.totalRevenue ?? 0;
  const totalServices = stats?.overview.totalServices ?? 0;
  const confirmedRevenue = stats?.overview.confirmedRevenue ?? 0;

  const revenueData = history?.revenue ?? [];
  const usersGrowthData = history?.usersGrowth ?? [];
  const postsByCategoryData = history?.postsByCategory ?? [];

  // Build recent activity items from dashboard data
  const recentActivityItems: {
    id: string;
    type: string;
    message: string;
    time: string;
    icon: typeof Users;
  }[] = [];

  if (dashboardData?.recentActivity) {
    const { users: recentUsers, quotes: recentQuotes, payments: recentPayments, tickets: recentTickets, posts: recentPosts } = dashboardData.recentActivity;

    recentUsers?.forEach((u) => {
      recentActivityItems.push({
        id: u.id,
        type: 'user',
        message: `New user registered: ${u.name}`,
        time: formatDate(u.createdAt),
        icon: Users,
      });
    });

    recentQuotes?.forEach((q) => {
      recentActivityItems.push({
        id: q.id,
        type: 'quote',
        message: `Quote "${q.title}" — ${q.status}`,
        time: formatDate(q.createdAt),
        icon: FileText,
      });
    });

    recentPayments?.forEach((p) => {
      recentActivityItems.push({
        id: p.id,
        type: 'payment',
        message: `Payment ${formatCurrency(p.amount)} via ${p.method} — ${p.status}`,
        time: formatDate(p.createdAt),
        icon: DollarSign,
      });
    });

    recentTickets?.forEach((tk) => {
      recentActivityItems.push({
        id: tk.id,
        type: 'ticket',
        message: `Support ticket: "${tk.subject}" — ${tk.status}`,
        time: formatDate(tk.createdAt),
        icon: CheckCircle2,
      });
    });

    recentPosts?.forEach((p) => {
      recentActivityItems.push({
        id: p.id,
        type: 'post',
        message: `Blog post published: "${p.title}"`,
        time: formatDate(p.createdAt),
        icon: BookOpen,
      });
    });

    // Sort by most recent
    recentActivityItems.sort((a, b) => {
      // Simple string comparison on date strings
      return a.time.localeCompare(b.time) * -1;
    });
  }

  const overviewCards = [
    {
      icon: Users,
      label: t('admin.usersTotal'),
      value: totalUsers.toLocaleString(),
      change: t('admin.activeCount', { count: stats?.users.active ?? 0 }),
      up: true,
      color: 'emerald',
    },
    {
      icon: FileText,
      label: t('admin.posts'),
      value: totalPosts.toLocaleString(),
      change: t('admin.publishedCount', { count: stats?.content?.publishedPosts ?? 0 }),
      up: true,
      color: 'green',
    },
    {
      icon: Briefcase,
      label: t('projects.title'),
      value: totalProjects.toLocaleString(),
      change: t('admin.featuredCount', { count: stats?.projects?.featured ?? 0 }),
      up: true,
      color: 'teal',
    },
    {
      icon: DollarSign,
      label: t('admin.totalRevenue'),
      value: formatCurrency(totalRevenue),
      change: t('admin.confirmedRevenue', { amount: formatCurrency(confirmedRevenue) }),
      up: true,
      color: 'yellow',
    },
  ];

  const managementSections = [
    {
      icon: Users,
      title: t('admin.users'),
      description: t('admin.usersList'),
      count: totalUsers,
      color: 'emerald',
    },
    {
      icon: Layers,
      title: t('services.title'),
      description: t('admin.moderationContent'),
      count: totalServices,
      color: 'green',
    },
    {
      icon: Briefcase,
      title: t('projects.title'),
      description: t('admin.manageProjects'),
      count: totalProjects,
      color: 'teal',
    },
    {
      icon: BookOpen,
      title: t('blog.title'),
      description: t('admin.moderationContent'),
      count: totalPosts,
      color: 'yellow',
    },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
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
                <h3 className="font-semibold text-red-700">{t('dashboard.loadError')}</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => window.location.reload()}
            >
              {t('common.retry')}
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
      {/* ── Stats Overview Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants}>
            <Card className="hover:shadow-md transition-all border-l-4 border-l-emerald-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <div className="flex items-center gap-1">
                      {card.up ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                        {card.change}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts Section ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-emerald-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            {t('common.overview')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            {t('admin.analytics')}
          </TabsTrigger>
          <TabsTrigger value="management" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            {t('admin.moderation')}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Revenue Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  {t('admin.analyticsRevenue')}
                </CardTitle>
                <CardDescription>{t('admin.monthlyRevenue')}</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #d1fae5' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name={t('admin.revenue')}
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ fill: '#059669', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name={t('admin.target')}
                        stroke="#6ee7b7"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Two-column charts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Users Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  {t('admin.analyticsUsers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersGrowthData.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={usersGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #d1fae5' }}
                      />
                      <Legend />
                      <Bar dataKey="newUsers" name={t('admin.newUsers')} fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalUsers" name={t('admin.totalUsers')} fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Posts by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-emerald-600" />
                  {t('admin.postsByCategory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postsByCategoryData.length === 0 ? (
                  <div className="text-center py-12">
                    <PieChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={postsByCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {postsByCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #d1fae5' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.activityRecent')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivityItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('common.noData')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentActivityItems.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.message}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics" className="space-y-6 mt-4">
          {/* Revenue Chart (larger) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.analyticsRevenue')}</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('common.noData')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d1fae5' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} />
                    <Line type="monotone" dataKey="target" stroke="#6ee7b7" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment methods breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.paymentMethodsBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.payments?.total === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('common.noData')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('financial.mpesa'), value: stats?.payments.mpesa ?? 0 },
                        { name: t('financial.transfer'), value: stats?.payments.transfer ?? 0 },
                        { name: t('financial.deposit'), value: stats?.payments.deposit ?? 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#10b981" />
                      <Cell fill="#34d399" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Management Tab ── */}
        <TabsContent value="management" className="space-y-6 mt-4">
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {managementSections.map((section) => (
              <Card key={section.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {section.count} {t('common.total')}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          <Eye className="h-4 w-4 mr-1" />
                          {t('common.details')}
                        </Button>
                        <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600">
                          <Settings className="h-4 w-4 mr-1" />
                          {t('common.settings')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* System Health */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-600" />
                {t('admin.systemHealth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50/80">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">{t('admin.serverStatus')}</span>
                  </div>
                  <p className="text-sm text-emerald-700">{t('admin.allSystemsOperational')}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">{t('admin.uptime')}</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    {stats?.overview ? t('admin.activeCount', { count: stats.overview.totalUsers }) : t('common.na')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/80">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">{t('dashboard.support')}</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {stats?.support ? t('admin.openTickets', { count: stats.support.openTickets }) : t('admin.openTickets', { count: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
