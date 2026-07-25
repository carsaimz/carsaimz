'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
const mockCommissionHistory = [
  { id: 'CM-001', client: 'Empresa Alpha', service: 'Website Dev', amount: 7500, rate: '10%', status: 'paid', date: '2025-01-20' },
  { id: 'CM-002', client: 'Beta Solutions', service: 'Mobile App', amount: 15000, rate: '10%', status: 'paid', date: '2025-02-15' },
  { id: 'CM-003', client: 'Gamma Corp', service: 'Cloud Setup', amount: 4500, rate: '10%', status: 'pending', date: '2025-03-10' },
  { id: 'CM-004', client: 'Delta Services', service: 'SEO Package', amount: 2500, rate: '10%', status: 'pending', date: '2025-04-05' },
  { id: 'CM-005', client: 'Omega Ltd', service: 'AI Integration', amount: 12000, rate: '10%', status: 'paid', date: '2025-05-01' },
];

const mockPortfolioProjects = [
  { id: 'PR-001', name: 'E-commerce Platform', client: 'Empresa Alpha', status: 'completed', value: 75000 },
  { id: 'PR-002', name: 'Mobile Banking App', client: 'Beta Solutions', status: 'inProgress', value: 150000 },
  { id: 'PR-003', name: 'Cloud Migration', client: 'Gamma Corp', status: 'completed', value: 45000 },
  { id: 'PR-004', name: 'SEO Campaign', client: 'Delta Services', status: 'planned', value: 25000 },
];

export function PartnerDashboard() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [affiliateLink] = useState(`https://carsai.mz/ref/${user?.id || 'demo-partner-001'}`);
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');

  const totalClicks = 342;
  const conversions = 18;
  const commissionsEarned = 41500;
  const pendingCommissions = 7000;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statsCards = [
    {
      icon: MousePointerClick,
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      color: 'emerald',
      description: '+45 this week',
    },
    {
      icon: ArrowRightLeft,
      label: 'Conversions',
      value: conversions,
      color: 'green',
      description: '5.3% conversion rate',
    },
    {
      icon: DollarSign,
      label: t('partner.commissionsEarned'),
      value: formatCurrency(commissionsEarned),
      color: 'teal',
      description: `${t('partner.commissionsRate')}: 10%`,
    },
    {
      icon: Clock,
      label: t('partner.commissionsPending'),
      value: formatCurrency(pendingCommissions),
      color: 'yellow',
      description: '2 pending conversions',
    },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>;
      case 'pending':
      case 'inProgress':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>;
      case 'planned':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{t('projects.planned')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('common.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                  {t('dashboard.welcome', { name: user?.name || 'Parceiro' })}
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
                  {copied ? 'Copied!' : t('common.copy')}
                </Button>
              </div>
              <div className="flex gap-3 mt-3">
                <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-white/10">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-white/10">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  QR Code
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
                {t('partner.commissionsRate')}: 10%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>{t('financial.item')}</TableHead>
                  <TableHead>{t('financial.amount')}</TableHead>
                  <TableHead>{t('partner.commissionsRate')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.createdAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCommissionHistory.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.id}</TableCell>
                    <TableCell>{commission.client}</TableCell>
                    <TableCell>{commission.service}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(commission.amount)}</TableCell>
                    <TableCell>{commission.rate}</TableCell>
                    <TableCell>{statusBadge(commission.status)}</TableCell>
                    <TableCell>{formatDate(commission.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockPortfolioProjects.map((project) => (
                <div key={project.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors border border-transparent hover:border-emerald-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    {statusBadge(project.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-emerald-700">{formatCurrency(project.value)}</p>
                    <Button variant="ghost" size="sm" className="text-emerald-600">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
              Available balance: {formatCurrency(commissionsEarned - 20000)}
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
                    placeholder="e.g. 5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('financial.paymentMethod')}</Label>
                  <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select method" />
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
                          Deposit
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
                    <Input id="bank-name" placeholder="e.g. Millennium BIM" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">{t('financial.transferAccount')}</Label>
                    <Input id="account-number" placeholder="Account number" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  {t('partner.withdrawalsRequest')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Processing time: 1-3 business days
                </p>
              </div>

              {/* Recent withdrawals preview */}
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium text-sm mb-3">{t('partner.withdrawalsHistory')}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm">MT 15,000 — M-Pesa</span>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('common.approved')}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Jan 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">MT 5,000 — Bank Transfer</span>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('common.pending')}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">May 10, 2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
