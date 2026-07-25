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

// ── Chart Colors (Emerald theme) ──
const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

// ── Mock chart data ──
const revenueData = [
  { month: 'Jan', revenue: 120000, target: 100000 },
  { month: 'Feb', revenue: 145000, target: 120000 },
  { month: 'Mar', revenue: 132000, target: 140000 },
  { month: 'Apr', revenue: 178000, target: 150000 },
  { month: 'May', revenue: 195000, target: 170000 },
  { month: 'Jun', revenue: 220000, target: 200000 },
  { month: 'Jul', revenue: 240000, target: 220000 },
  { month: 'Aug', revenue: 215000, target: 230000 },
  { month: 'Sep', revenue: 260000, target: 240000 },
  { month: 'Oct', revenue: 290000, target: 260000 },
  { month: 'Nov', revenue: 310000, target: 280000 },
  { month: 'Dec', revenue: 350000, target: 300000 },
];

const usersGrowthData = [
  { month: 'Jan', newUsers: 45, totalUsers: 320 },
  { month: 'Feb', newUsers: 62, totalUsers: 382 },
  { month: 'Mar', newUsers: 58, totalUsers: 440 },
  { month: 'Apr', newUsers: 78, totalUsers: 518 },
  { month: 'May', newUsers: 95, totalUsers: 613 },
  { month: 'Jun', newUsers: 110, totalUsers: 723 },
  { month: 'Jul', newUsers: 88, totalUsers: 811 },
  { month: 'Aug', newUsers: 105, totalUsers: 916 },
  { month: 'Sep', newUsers: 120, totalUsers: 1036 },
  { month: 'Oct', newUsers: 140, totalUsers: 1176 },
  { month: 'Nov', newUsers: 155, totalUsers: 1331 },
  { month: 'Dec', newUsers: 175, totalUsers: 1506 },
];

const postsByCategoryData = [
  { name: 'Technology', value: 35 },
  { name: 'Business', value: 25 },
  { name: 'Tutorial', value: 20 },
  { name: 'News', value: 15 },
  { name: 'Community', value: 5 },
];

const recentActivity = [
  { id: 1, type: 'user', message: 'New user registered: Maria Santos', time: '5 min', icon: Users },
  { id: 2, type: 'payment', message: 'Payment confirmed: MT 75,000 via M-Pesa', time: '15 min', icon: DollarSign },
  { id: 3, type: 'post', message: 'New blog post published: "AI in Mozambique"', time: '1 hour', icon: FileText },
  { id: 4, type: 'project', message: 'Project completed: E-commerce Platform', time: '2 hours', icon: Briefcase },
  { id: 5, type: 'ticket', message: 'Support ticket resolved: #ST-042', time: '3 hours', icon: CheckCircle2 },
  { id: 6, type: 'system', message: 'System backup completed successfully', time: '4 hours', icon: Server },
];

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
  payments: {
    total: number;
    totalRevenue: number;
    confirmedRevenue: number;
    mpesa: number;
    transfer: number;
    deposit: number;
  };
}

export function AdminDashboard() {
  const { t, formatCurrency } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {
        // Use fallback mock data
        setStats({
          overview: { totalUsers: 1506, totalPosts: 100, totalProjects: 48, totalServices: 8, totalForumTopics: 250, totalRevenue: 350000, confirmedRevenue: 280000 },
          users: { total: 1506, active: 1200, admins: 3, partners: 25, regular: 1478 },
          payments: { total: 180, totalRevenue: 350000, confirmedRevenue: 280000, mpesa: 85, transfer: 55, deposit: 40 },
        });
      });
  }, []);

  const totalUsers = stats?.users.total ?? 1506;
  const totalPosts = stats?.overview.totalPosts ?? 100;
  const totalProjects = stats?.overview.totalProjects ?? 48;
  const totalRevenue = stats?.overview.totalRevenue ?? 350000;

  const overviewCards = [
    {
      icon: Users,
      label: t('admin.usersTotal'),
      value: totalUsers.toLocaleString(),
      change: '+12%',
      up: true,
      color: 'emerald',
    },
    {
      icon: FileText,
      label: t('admin.analyticsOverview') + ' — Posts',
      value: totalPosts.toLocaleString(),
      change: '+8%',
      up: true,
      color: 'green',
    },
    {
      icon: Briefcase,
      label: t('projects.title'),
      value: totalProjects.toLocaleString(),
      change: '+5%',
      up: true,
      color: 'teal',
    },
    {
      icon: DollarSign,
      label: t('admin.totalRevenue'),
      value: formatCurrency(totalRevenue),
      change: '+15%',
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
      count: stats?.overview.totalServices ?? 8,
      color: 'green',
    },
    {
      icon: Briefcase,
      title: t('projects.title'),
      description: 'Manage platform projects',
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
                      <span className="text-xs text-muted-foreground">vs last month</span>
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
                      name="Revenue"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ fill: '#059669', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target"
                      stroke="#6ee7b7"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={usersGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d1fae5' }}
                    />
                    <Legend />
                    <Bar dataKey="newUsers" name="New Users" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalUsers" name="Total Users" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Posts by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-emerald-600" />
                  Posts by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      label={({ name, value }) => `${name}: ${value}%`}
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
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.message}</p>
                        <p className="text-xs text-muted-foreground">{item.time} ago</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
            </CardContent>
          </Card>

          {/* Payment methods breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Methods Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'M-Pesa', value: stats?.payments.mpesa ?? 85 },
                      { name: 'Transfer', value: stats?.payments.transfer ?? 55 },
                      { name: 'Deposit', value: stats?.payments.deposit ?? 40 },
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
                    <div className={`p-3 rounded-xl bg-${section.color}-50 text-${section.color}-600`}>
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
                    <span className="font-medium">Server Status</span>
                  </div>
                  <p className="text-sm text-emerald-700">All systems operational</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">Uptime</span>
                  </div>
                  <p className="text-sm text-emerald-700">99.8% — 30 days</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/80">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Warnings</span>
                  </div>
                  <p className="text-sm text-yellow-700">2 minor alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
