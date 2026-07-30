'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Link2,
  Copy,
  MousePointerClick,
  ArrowRightLeft,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  Briefcase,
  Wallet,
  Phone,
  Building2,
  BanknoteIcon,
  ArrowDownToLine,
  Star,
  Award,
  ExternalLink,
  Share2,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { APP_PUBLIC_URL } from '@/lib/client-config';

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ── Types for API data ──
interface Commission {
  id: string;
  userId: string;
  amount: number;
  status: string; // pending, approved, paid
  createdAt: string;
}

interface Click {
  id: string;
  userId: string;
  linkCode: string;
  ip: string | null;
  createdAt: string;
}

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  client: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface PartnerData {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  stats: {
    totalClicks: number;
    totalCommissions: number;
    pendingCommissions: number;
    approvedCommissions: number;
    paidCommissions: number;
    totalCommissionAmount: number;
  };
  recentActivity: {
    clicks: Click[];
    commissions: Commission[];
  };
}

export function PartnerDashboard() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<PartnerData | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [affiliateLink] = useState(`${APP_PUBLIC_URL}/ref/${user?.id || 'demo-partner-001'}`);
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    // Fetch dashboard data and projects in parallel
    Promise.all([
      apiFetch(`/api/dashboard?role=partner&userId=${user.id}`).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error(t('common.serverNonJson'));
        return data;
      }),
      apiFetch('/api/projects').then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await safeJson(res);
        if (!data) throw new Error(t('common.serverNonJson'));
        return data;
      }),
    ])
      .then(([dashboardJson, projectsJson]) => {
        if (dashboardJson.success && dashboardJson.data) {
          setData(dashboardJson.data as PartnerData);
        } else {
          setError(dashboardJson.message || t('dashboard.loadError'));
        }
        if (projectsJson.success && projectsJson.data) {
          setProjects(projectsJson.data as PortfolioProject[]);
        }
      })
      .catch((err) => {
        setError(err.message || t('common.networkError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalClicks = data?.stats.totalClicks ?? 0;
  const totalCommissions = data?.stats.totalCommissions ?? 0;
  const commissionsEarned = data?.stats.totalCommissionAmount ?? 0;
  const pendingCommissions = data?.stats.pendingCommissions ?? 0;
  const approvedCommissions = data?.stats.approvedCommissions ?? 0;
  const paidCommissions = data?.stats.paidCommissions ?? 0;
  const commissions = data?.recentActivity.commissions ?? [];

  const conversionRate = totalClicks > 0 ? ((totalCommissions / totalClicks) * 100).toFixed(1) : '0.0';

  const statsCards = [
    {
      icon: MousePointerClick,
      label: t('partner.totalClicks'),
      value: totalClicks.toLocaleString(),
      color: 'emerald',
      description: t('partner.recentClicks', { count: data?.recentActivity.clicks?.length ?? 0 }),
    },
    {
      icon: ArrowRightLeft,
      label: t('partner.conversions'),
      value: totalCommissions,
      color: 'green',
      description: t('partner.conversionRateValue', { rate: conversionRate }),
    },
    {
      icon: DollarSign,
      label: t('partner.commissionsEarned'),
      value: formatCurrency(commissionsEarned),
      color: 'teal',
      description: t('partner.approvedAndPaid', { approved: approvedCommissions, paid: paidCommissions }),
    },
    {
      icon: Clock,
      label: t('partner.commissionsPending'),
      value: formatCurrency(
        commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount, 0)
      ),
      color: 'yellow',
      description: t('partner.pendingConversions', { count: pendingCommissions }),
    },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'pending':
      case 'in_progress':
      case 'inProgress':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'planned':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{t('projects.planned')}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
            <Skeleton className="h-8 w-48 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20 mt-2" />
            <Skeleton className="h-20 w-full bg-white/20 mt-4 rounded-xl" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
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
      {/* ── Welcome + Affiliate Link Section ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 border-0 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {t('dashboard.welcome', { name: data?.user?.name || user?.name || 'Parceiro' })}
                </h1>
                <p className="text-emerald-200 mt-1">{t('partner.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                  {t('partner.tierGold')}
                </Badge>
              </div>
            </div>

            {/* Affiliate Link */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold text-white">{t('partner.affiliateLink')}</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-emerald-100 text-sm font-mono truncate">
                  {affiliateLink}
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="bg-yellow-400 hover:bg-yellow-300 text-emerald-900 font-semibold rounded-lg"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? t('common.copied') : t('common.copy')}
                </Button>
              </div>
              <div className="flex gap-3 mt-3">
                <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-white/10">
                  <Share2 className="h-4 w-4 mr-1" />
                  {t('common.share')}
                </Button>
                <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-white/10">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t('common.qrCode')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-emerald-600">{stat.description}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Commission History Table ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                {t('partner.commissions')}
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                {totalCommissions} {t('common.total')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('partner.noCommissions')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('partner.shareAffiliateLink')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.id')}</TableHead>
                    <TableHead>{t('financial.amount')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.createdAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(commission.amount)}</TableCell>
                      <TableCell>{statusBadge(commission.status)}</TableCell>
                      <TableCell>{formatDate(commission.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Portfolio Section ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              {t('partner.portfolio')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors border border-transparent hover:border-emerald-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">{project.client || '—'}</p>
                      </div>
                      <Badge className={project.isFeatured
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }>
                        {project.isFeatured ? t('common.featured') : t('common.published')}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-emerald-600">{formatDate(project.createdAt)}</p>
                      <Button variant="ghost" size="sm" className="text-emerald-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Withdrawal Request Form ── */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              {t('partner.withdrawalsRequest')}
            </CardTitle>
            <CardDescription>
              {t('partner.availableBalance')} {formatCurrency(commissionsEarned)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">{t('financial.amount')} (MT)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder={t('partner.amountPlaceholder')}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('financial.paymentMethod')}</Label>
                  <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('partner.selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-600" />
                          {t('financial.mpesa')}
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          {t('financial.transfer')}
                        </div>
                      </SelectItem>
                      <SelectItem value="deposit">
                        <div className="flex items-center gap-2">
                          <BanknoteIcon className="h-4 w-4 text-emerald-600" />
                          {t('financial.deposit')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional fields based on method */}
              {withdrawMethod === 'mpesa' && (
                <div className="space-y-2">
                  <Label htmlFor="mpesa-number">{t('financial.mpesaNumber')}</Label>
                  <Input id="mpesa-number" placeholder="+258 84 XXX XXX" />
                </div>
              )}

              {withdrawMethod === 'transfer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">{t('financial.transferBank')}</Label>
                    <Input id="bank-name" placeholder={t('partner.bankPlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">{t('financial.transferAccount')}</Label>
                    <Input id="account-number" placeholder={t('partner.accountNumber')} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  {t('partner.withdrawalsRequest')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {t('partner.processingTime')}
                </p>
              </div>

              {/* Recent withdrawals from paid commissions */}
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium text-sm mb-3">{t('partner.withdrawalsHistory')}</h4>
                {commissions.filter((c) => c.status === 'paid').length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">{t('partner.noWithdrawals')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {commissions
                      .filter((c) => c.status === 'paid')
                      .slice(0, 5)
                      .map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm">{formatCurrency(commission.amount)} — {t('partner.commission')}</span>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(commission.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
