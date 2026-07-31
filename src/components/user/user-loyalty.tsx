'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Trophy,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  Award,
  Crown,
  Gem,
  Diamond,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  History,
  Percent,
  HeadphonesIcon,
  Lock,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ── Types ──
interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

interface TierConfig {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: {
    discountPercent: number;
    prioritySupport: boolean;
    freeServices: number;
    exclusiveAccess: boolean;
    bonusMultiplier: number;
    customBadge: boolean;
  };
  color: string;
  icon: string;
  order: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  points: number;
  reason: string;
  referenceId: string | null;
  description: string;
  createdAt: string;
}

// ── Tier icon mapping ──
const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Award,
  Crown,
  Gem,
  Diamond,
};

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const TIER_GRADIENTS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-gray-300 to-slate-400',
  diamond: 'from-cyan-300 to-blue-400',
};

// ── Component ──
export function UserLoyalty() {
  const { t } = useLanguage();
  const { user, idToken } = useAuthStore();

  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [allTiers, setAllTiers] = useState<TierConfig[]>([]);
  const [currentTierConfig, setCurrentTierConfig] = useState<TierConfig | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // Redeem dialog
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState<number>(100);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ couponCode: string; couponValue: number } | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Coupon copied
  const [copied, setCopied] = useState(false);

  // Fetch loyalty data
  const fetchLoyaltyData = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/loyalty', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await safeJson<any>(res);
      if (data?.success) {
        setAccount(data.data.account);
        setAllTiers(data.data.allTiers || []);
        setCurrentTierConfig(data.data.tierConfig);
      }
    } catch (err) {
      console.error('[Loyalty] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!idToken) return;
    setTxLoading(true);
    try {
      const res = await apiFetch('/api/loyalty/transactions?limit=50', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await safeJson<any>(res);
      if (data?.success) {
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error('[Loyalty] Failed to fetch transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    fetchLoyaltyData();
    fetchTransactions();
  }, [fetchLoyaltyData, fetchTransactions]);

  // Handle redeem
  const handleRedeem = async () => {
    if (!idToken || redeemPoints <= 0) return;
    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemResult(null);
    try {
      const res = await apiFetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points: redeemPoints }),
      });
      const data = await safeJson<any>(res);
      if (data?.success) {
        setRedeemResult({
          couponCode: data.data.couponCode,
          couponValue: data.data.couponValue,
        });
        // Refresh data
        await fetchLoyaltyData();
        await fetchTransactions();
      } else {
        setRedeemError(data?.message || 'Failed to redeem points');
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to redeem points');
    } finally {
      setRedeemLoading(false);
    }
  };

  // Copy coupon code
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Calculate tier progress
  const getTierProgress = () => {
    if (!account || !allTiers.length) return 0;
    const currentTierOrder = allTiers.find(t => t.name === account.tier);
    if (!currentTierOrder) return 0;

    const nextTier = allTiers.find(t => t.order === currentTierOrder.order + 1);
    if (!nextTier) return 100; // Max tier

    const currentMin = currentTierOrder.minPoints;
    const nextMin = nextTier.minPoints;
    const progress = ((account.totalEarned - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Get next tier info
  const getNextTierInfo = () => {
    if (!account || !allTiers.length) return null;
    const currentTierOrder = allTiers.find(t => t.name === account.tier);
    if (!currentTierOrder) return null;
    const nextTier = allTiers.find(t => t.order === currentTierOrder.order + 1);
    if (!nextTier) return null;
    return { name: nextTier.name, minPoints: nextTier.minPoints, pointsNeeded: nextTier.minPoints - account.totalEarned };
  };

  const nextTierInfo = getNextTierInfo();
  const tierProgress = getTierProgress();

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // ── No account ──
  if (!account) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('loyalty.noAccount')}</p>
        </CardContent>
      </Card>
    );
  }

  const TierIcon = TIER_ICONS[currentTierConfig?.icon || 'Shield'] || Shield;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Points Balance */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${TIER_GRADIENTS[account.tier] || 'from-gray-400 to-gray-600'} opacity-10`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{t('loyalty.currentBalance')}</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Star className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold">{account.points.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('loyalty.pointsWorth', { value: account.points.toLocaleString() })}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Earned */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{t('loyalty.totalEarned')}</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{account.totalEarned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('loyalty.lifetimePoints')}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Redeemed */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{t('loyalty.totalRedeemed')}</span>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Gift className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600">{account.totalRedeemed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('loyalty.redeemedAsCoupons')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Current Tier & Progress ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${TIER_GRADIENTS[account.tier] || 'from-gray-400 to-gray-600'}`} />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Tier Badge */}
              <motion.div
                variants={scaleVariants}
                className="flex-shrink-0 flex items-center gap-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${TIER_COLORS[account.tier]}22`, border: `2px solid ${TIER_COLORS[account.tier]}` }}
                >
                  <span style={{ color: TIER_COLORS[account.tier] }}><TierIcon className="h-8 w-8" /></span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold capitalize" style={{ color: TIER_COLORS[account.tier] }}>
                    {account.tier}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('loyalty.currentTier')}</p>
                </div>
              </motion.div>

              {/* Progress to Next Tier */}
              <div className="flex-1">
                {nextTierInfo ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {t('loyalty.progressTo', { tier: nextTierInfo.name.charAt(0).toUpperCase() + nextTierInfo.name.slice(1) })}
                      </span>
                      <span className="text-sm font-medium">{Math.round(tierProgress)}%</span>
                    </div>
                    <Progress value={tierProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('loyalty.pointsNeeded', { count: nextTierInfo.pointsNeeded.toLocaleString() })}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <Sparkles className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('loyalty.maxTierReached')}</p>
                  </div>
                )}
              </div>

              {/* Redeem Button */}
              <Dialog open={redeemOpen} onOpenChange={(v) => { setRedeemOpen(v); if (!v) { setRedeemResult(null); setRedeemError(null); } }}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2" disabled={account.points < 10}>
                    <Gift className="h-4 w-4" />
                    {t('loyalty.redeemPoints')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('loyalty.redeemPoints')}</DialogTitle>
                    <DialogDescription>
                      {t('loyalty.redeemDescription', { balance: account.points.toLocaleString() })}
                    </DialogDescription>
                  </DialogHeader>

                  {!redeemResult ? (
                    <>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">{t('loyalty.pointsToRedeem')}</label>
                          <Input
                            type="number"
                            min={10}
                            max={Math.min(account.points, 5000)}
                            value={redeemPoints}
                            onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('loyalty.redeemValue', { value: redeemPoints.toLocaleString() })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('loyalty.redeemLimits')}
                          </p>
                        </div>
                        {redeemError && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <XCircle className="h-4 w-4" />
                            {redeemError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRedeemOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleRedeem}
                          disabled={redeemLoading || redeemPoints < 10 || redeemPoints > account.points}
                        >
                          {redeemLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {t('loyalty.confirmRedeem')}
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <div className="py-6 text-center space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
                      </motion.div>
                      <h3 className="text-lg font-semibold">{t('loyalty.redeemSuccess')}</h3>
                      <p className="text-sm text-muted-foreground">{t('loyalty.couponGenerated')}</p>
                      <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                        <code className="text-lg font-mono font-bold">{redeemResult.couponCode}</code>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(redeemResult.couponCode)}>
                          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('loyalty.couponValue', { value: redeemResult.couponValue.toLocaleString() })}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('loyalty.couponExpiry')}</p>
                      <Button onClick={() => setRedeemOpen(false)} className="mt-4">
                        {t('common.close')}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Tabs: Benefits & Transactions ── */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="benefits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="benefits" className="gap-2">
              <Award className="h-4 w-4" />
              {t('loyalty.tierBenefits')}
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-2">
              <Trophy className="h-4 w-4" />
              {t('loyalty.allTiers')}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              {t('loyalty.transactionHistory')}
            </TabsTrigger>
          </TabsList>

          {/* ── Current Tier Benefits ── */}
          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span style={{ color: TIER_COLORS[account.tier] }}><TierIcon className="h-5 w-5" /></span>
                  {t('loyalty.yourBenefits')}
                </CardTitle>
                <CardDescription>{t('loyalty.benefitsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Discount */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Percent className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{t('loyalty.discount')}</p>
                      <p className="text-xs text-muted-foreground">{currentTierConfig?.benefits?.discountPercent || 0}% {t('loyalty.onServices')}</p>
                    </div>
                  </div>
                  {/* Priority Support */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <HeadphonesIcon className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{t('loyalty.prioritySupport')}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentTierConfig?.benefits?.prioritySupport ? t('loyalty.included') : t('loyalty.notIncluded')}
                      </p>
                    </div>
                  </div>
                  {/* Free Services */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Gift className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{t('loyalty.freeServices')}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentTierConfig?.benefits?.freeServices || 0} {t('loyalty.perMonth')}
                      </p>
                    </div>
                  </div>
                  {/* Exclusive Access */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Lock className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{t('loyalty.exclusiveAccess')}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentTierConfig?.benefits?.exclusiveAccess ? t('loyalty.included') : t('loyalty.notIncluded')}
                      </p>
                    </div>
                  </div>
                  {/* Bonus Multiplier */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Zap className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{t('loyalty.earnMultiplier')}</p>
                      <p className="text-xs text-muted-foreground">{currentTierConfig?.benefits?.bonusMultiplier || 1.0}x</p>
                    </div>
                  </div>
                  {/* Custom Badge */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Award className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{t('loyalty.customBadge')}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentTierConfig?.benefits?.customBadge ? t('loyalty.included') : t('loyalty.notIncluded')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── All Tiers ── */}
          <TabsContent value="tiers">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {allTiers.map((tier) => {
                const TierIconComp = TIER_ICONS[tier.icon] || Shield;
                const isCurrent = tier.name === account.tier;
                return (
                  <motion.div
                    key={tier.id}
                    variants={scaleVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card className={`relative overflow-hidden ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                      {isCurrent && (
                        <Badge className="absolute top-2 right-2 text-xs" variant="default">
                          {t('loyalty.current')}
                        </Badge>
                      )}
                      <div className={`h-1.5 bg-gradient-to-r ${TIER_GRADIENTS[tier.name] || 'from-gray-400 to-gray-600'}`} />
                      <CardContent className="p-4 text-center">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                          style={{ backgroundColor: `${TIER_COLORS[tier.name]}22`, border: `2px solid ${TIER_COLORS[tier.name]}` }}
                        >
                          <span style={{ color: TIER_COLORS[tier.name] }}><TierIconComp className="h-6 w-6" /></span>
                        </div>
                        <h4 className="font-semibold capitalize mb-1" style={{ color: TIER_COLORS[tier.name] }}>{tier.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {tier.minPoints.toLocaleString()}+ {t('loyalty.points')}
                        </p>
                        <div className="space-y-1 text-xs text-left">
                          <div className="flex items-center gap-1.5">
                            <Percent className="h-3 w-3 text-emerald-500" />
                            <span>{tier.benefits.discountPercent}% {t('loyalty.discount')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-emerald-500" />
                            <span>{tier.benefits.bonusMultiplier}x {t('loyalty.multiplier')}</span>
                          </div>
                          {tier.benefits.prioritySupport && (
                            <div className="flex items-center gap-1.5">
                              <HeadphonesIcon className="h-3 w-3 text-emerald-500" />
                              <span>{t('loyalty.prioritySupport')}</span>
                            </div>
                          )}
                          {tier.benefits.freeServices > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Gift className="h-3 w-3 text-emerald-500" />
                              <span>{tier.benefits.freeServices} {t('loyalty.freeServices')}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Transaction History ── */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t('loyalty.transactionHistory')}
                </CardTitle>
                <CardDescription>{t('loyalty.transactionDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">{t('loyalty.noTransactions')}</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('loyalty.type')}</TableHead>
                          <TableHead>{t('loyalty.description')}</TableHead>
                          <TableHead className="text-right">{t('loyalty.points')}</TableHead>
                          <TableHead>{t('loyalty.date')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {tx.points > 0 ? (
                                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-orange-500" />
                                )}
                                <Badge
                                  variant={tx.type === 'earn' || tx.type === 'bonus' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {tx.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{tx.description}</TableCell>
                            <TableCell className={`text-right font-medium ${tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600'}`}>
                              {tx.points > 0 ? '+' : ''}{tx.points}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── How to Earn Points ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              {t('loyalty.howToEarn')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('loyalty.servicePurchase')}</p>
                  <p className="text-xs text-muted-foreground">{t('loyalty.servicePurchaseDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('loyalty.referralBonus')}</p>
                  <p className="text-xs text-muted-foreground">{t('loyalty.referralBonusDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                  <Star className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('loyalty.welcomeBonus')}</p>
                  <p className="text-xs text-muted-foreground">{t('loyalty.welcomeBonusDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                  <Award className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('loyalty.reviewBonus')}</p>
                  <p className="text-xs text-muted-foreground">{t('loyalty.reviewBonusDesc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}


