'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, Users, TrendingUp, Calendar, AlertCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// Types for API responses
interface StatsOverview {
  totalUsers: number;
  totalPosts: number;
  totalProjects: number;
  totalServices: number;
  totalForumTopics: number;
  totalTestimonials: number;
  totalQuotes: number;
  totalRevenue: number;
  confirmedRevenue: number;
}

interface StatsUsers {
  total: number;
  active: number;
  admins: number;
  partners: number;
  regular: number;
}

interface StatsPayments {
  total: number;
  totalRevenue: number;
  confirmedRevenue: number;
  mpesa: number;
  transfer: number;
  deposit: number;
}

interface StatsData {
  overview: StatsOverview;
  users: StatsUsers;
  payments: StatsPayments;
  [key: string]: unknown;
}

interface RevenueEntry {
  month: string;
  revenue: number;
  bookings: number;
}

interface UsersGrowthEntry {
  month: string;
  newUsers: number;
  totalUsers: number;
}

interface ServiceUsageEntry {
  name: string;
  count: number;
  revenue: number;
}

interface HistoryData {
  revenue: RevenueEntry[];
  usersGrowth: UsersGrowthEntry[];
  serviceUsage: ServiceUsageEntry[];
}

// Loading skeleton for a card
function CardSkeleton() {
  return (
    <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="mt-2 h-5 w-20" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for a table
function TableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminReports() {
  const { t, language, formatCurrency } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/stats/history'),
      ]);

      if (!statsRes.ok || !historyRes.ok) {
        throw new Error(t('admin.reportsLoadError'));
      }

      const statsJson = await statsRes.json();
      const historyJson = await historyRes.json();

      if (!statsJson.success || !historyJson.success) {
        throw new Error(t('admin.reportsLoadError'));
      }

      setStats(statsJson.data as StatsData);
      setHistory(historyJson.data as HistoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.reportsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format month names in the user's language
  const formatMonth = useCallback(
    (monthStr: string) => {
      // The API returns short month names like "Jan", "Feb" etc. in English.
      // We need to convert them to the user's locale.
      const monthMap: Record<string, string> = {
        Jan: '0', Feb: '1', Mar: '2', Apr: '3', May: '4', Jun: '5',
        Jul: '6', Aug: '7', Sep: '8', Oct: '9', Nov: '10', Dec: '11',
      };
      const monthIndex = monthMap[monthStr];
      if (monthIndex !== undefined) {
        const date = new Date(2024, parseInt(monthIndex), 1);
        return date.toLocaleDateString(language, { month: 'short' });
      }
      return monthStr;
    },
    [language]
  );

  // Derive summary values from real data
  const totalRevenue = stats?.overview?.confirmedRevenue ?? stats?.overview?.totalRevenue ?? 0;
  const totalBookings = stats?.payments?.total ?? 0;
  const totalNewUsers = history?.usersGrowth
    ? history.usersGrowth.reduce((sum, r) => sum + r.newUsers, 0)
    : stats?.users?.total ?? 0;

  // Check if we have any meaningful data
  const hasData =
    (history?.revenue && history.revenue.some((r) => r.revenue > 0)) ||
    (history?.usersGrowth && history.usersGrowth.some((r) => r.newUsers > 0)) ||
    (history?.serviceUsage && history.serviceUsage.some((r) => r.count > 0)) ||
    (stats?.overview && (stats.overview.totalRevenue > 0 || stats.overview.totalUsers > 0 || stats.overview.totalQuotes > 0));

  // Error state
  if (error) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.reports') || 'Reports'}
          </h2>
        </motion.div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchData} variant="outline">
              {t('common.retry') || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.reports') || 'Reports'}
          </h2>
          <p className="text-muted-foreground mt-1">{t('admin.analyticsOverview') || 'Loading reports...'}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TableSkeleton />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TableSkeleton />
        </motion.div>
      </motion.div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.reports') || 'Reports'}
          </h2>
        </motion.div>
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Database className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">{t('admin.reportsNoData')}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          {t('admin.reports') || 'Reports'}
        </h2>
        <p className="text-muted-foreground mt-1">{t('admin.analyticsOverview')}</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.reportsTotalRevenue')}</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
            {stats?.payments?.confirmedRevenue !== undefined && stats.payments.totalRevenue > 0 && (
              <Badge className="mt-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                <TrendingUp className="w-3 h-3 mr-1" />
                {formatCurrency(stats.payments.confirmedRevenue)} {t('admin.confirmedRevenue', { amount: '' }).replace(/—?\s*$/, '')}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.reportsTotalBookings')}</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalBookings.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-500" />
            </div>
            {stats?.payments && stats.payments.mpesa + stats.payments.transfer + stats.payments.deposit > 0 && (
              <Badge className="mt-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.payments.mpesa + stats.payments.transfer + stats.payments.deposit} {t('admin.payments').toLowerCase()}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.reportsNewUsers')}</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalNewUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
            {stats?.users?.active !== undefined && (
              <Badge className="mt-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.users.active} {t('admin.usersActive').toLowerCase()}
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Report */}
      {history?.revenue && history.revenue.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t('admin.reportsRevenueMonthly')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                    <TableHead>{t('admin.reportsMonth')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsRevenue')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsBookings')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsAvgPerBooking')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.revenue.map((row) => {
                    // Use actual bookings count from the API (not estimated)
                    const avgPerBooking = row.bookings > 0 ? row.revenue / row.bookings : 0;
                    return (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{formatMonth(row.month)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right">{row.bookings}</TableCell>
                        <TableCell className="text-right">
                          {avgPerBooking > 0 ? formatCurrency(Math.round(avgPerBooking)) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Growth Report */}
      {history?.usersGrowth && history.usersGrowth.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t('admin.reportsUserGrowth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                    <TableHead>{t('admin.reportsMonth')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsNewUsersCol')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsTotalUsers')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsGrowthRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.usersGrowth.map((row, i) => {
                    const prevTotal =
                      i > 0 ? history.usersGrowth[i - 1].totalUsers : row.totalUsers - row.newUsers;
                    const growthRate = prevTotal > 0 ? ((row.newUsers / prevTotal) * 100).toFixed(1) : '0';
                    return (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{formatMonth(row.month)}</TableCell>
                        <TableCell className="text-right">{row.newUsers}</TableCell>
                        <TableCell className="text-right">{row.totalUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                            +{growthRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Service Usage Report (from actual quote records) */}
      {history?.serviceUsage && history.serviceUsage.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t('admin.reportsServiceUsage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                    <TableHead>{t('admin.reportsService')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsCount')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsRevenue')}</TableHead>
                    <TableHead className="text-right">{t('admin.reportsAvgRevenue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.serviceUsage.map((row) => {
                    // Use actual revenue from proposals associated with quotes
                    const avgRevenue = row.count > 0 ? Math.round(row.revenue / row.count) : 0;
                    return (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right">
                          {row.revenue > 0 ? formatCurrency(row.revenue) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {avgRevenue > 0 ? formatCurrency(avgRevenue) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
