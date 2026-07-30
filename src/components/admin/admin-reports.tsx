'use client';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// Mock data for reports
const revenueData = [
  { month: 'Jan', revenue: 12500, bookings: 45 },
  { month: 'Feb', revenue: 15800, bookings: 52 },
  { month: 'Mar', revenue: 18200, bookings: 61 },
  { month: 'Apr', revenue: 16900, bookings: 58 },
  { month: 'May', revenue: 21300, bookings: 72 },
  { month: 'Jun', revenue: 24100, bookings: 85 },
];

const userGrowthData = [
  { month: 'Jan', newUsers: 120, totalUsers: 1200 },
  { month: 'Feb', newUsers: 145, totalUsers: 1345 },
  { month: 'Mar', newUsers: 180, totalUsers: 1525 },
  { month: 'Apr', newUsers: 160, totalUsers: 1685 },
  { month: 'May', newUsers: 210, totalUsers: 1895 },
  { month: 'Jun', newUsers: 250, totalUsers: 2145 },
];

const serviceUsageData = [
  { service: 'Web Development', count: 45, revenue: 22500 },
  { service: 'Mobile App', count: 32, revenue: 19200 },
  { service: 'UI/UX Design', count: 28, revenue: 11200 },
  { service: 'Cloud Setup', count: 18, revenue: 14400 },
  { service: 'Consulting', count: 15, revenue: 7500 },
];

export function AdminReports() {
  const { t } = useLanguage();

  const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
  const totalBookings = revenueData.reduce((sum, r) => sum + r.bookings, 0);
  const totalNewUsers = userGrowthData.reduce((sum, r) => sum + r.newUsers, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-emerald-600" />{t('admin.reports') || 'Reports'}</h2>
        <p className="text-muted-foreground mt-1">Platform reports and analytics overview</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.5%
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-emerald-700">{totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-500" />
            </div>
            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200">
              <TrendingUp className="w-3 h-3 mr-1" /> +8.3%
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Users</p>
                <p className="text-2xl font-bold text-emerald-700">{totalNewUsers}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200">
              <TrendingUp className="w-3 h-3 mr-1" /> +18.7%
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Report */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Revenue Report (Monthly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/50">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Avg. per Booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right">${row.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.bookings}</TableCell>
                    <TableCell className="text-right">${Math.round(row.revenue / row.bookings).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Growth Report */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              User Growth Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/50">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">New Users</TableHead>
                  <TableHead className="text-right">Total Users</TableHead>
                  <TableHead className="text-right">Growth Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userGrowthData.map((row, i) => {
                  const prevTotal = i > 0 ? userGrowthData[i - 1].totalUsers : row.totalUsers - row.newUsers;
                  const growthRate = prevTotal > 0 ? ((row.newUsers / prevTotal) * 100).toFixed(1) : '0';
                  return (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{row.newUsers}</TableCell>
                      <TableCell className="text-right">{row.totalUsers.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">+{growthRate}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Usage Report */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Service Usage Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/50">
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg. Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceUsageData.map((row) => (
                  <TableRow key={row.service}>
                    <TableCell className="font-medium">{row.service}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">${row.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${Math.round(row.revenue / row.count).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
