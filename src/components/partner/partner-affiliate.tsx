'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, ExternalLink, Share2, Users, Tag, DollarSign, TrendingUp, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { APP_PUBLIC_URL } from '@/lib/client-config';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface AffiliateStats {
  totalReferredUsers: number;
  totalCouponRedemptions: number;
  totalClicks: number;
  totalCommission: number;
  commissionFromServices: number;
  commissionFromCoupons: number;
  commissionBreakdown: Record<string, number>;
  commissionRate: number;
  partnerTier: string;
  recentReferredUsers: Array<{
    id: string;
    name: string;
    email: string | null;
    createdAt: string;
  }>;
}

/**
 * Get the base URL for affiliate links.
 * Uses the detected window.location.origin if it's a production URL,
 * otherwise falls back to the hardcoded APP_PUBLIC_URL.
 */
function getAffiliateBaseUrl(): string {
  if (typeof window === 'undefined') return APP_PUBLIC_URL;
  const origin = window.location.origin;
  // If we're on a known production URL, use it
  if (origin.includes('carsaimz.vercel.app') || origin.includes('carsai.mz')) {
    return origin;
  }
  // Fallback to hardcoded production URL
  return APP_PUBLIC_URL;
}

export function PartnerAffiliate() {
  const { t, formatDate, formatCurrency } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const affiliateLink = `${getAffiliateBaseUrl()}/ref/${user?.id || 'demo-partner-001'}`;

  // Fetch affiliate stats
  useEffect(() => {
    const partnerId = user?.id;
    if (!partnerId) return;

    apiFetch(`/api/affiliate/stats?partnerId=${partnerId}`)
      .then((res) => safeJson(res))
      .then((data) => {
        if (!data) {
          setError(t('common.serverNonJson'));
          return;
        }
        if (data.success && data.data) {
          setStats(data.data);
        } else {
          setError(data.message || 'Failed to load stats');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id, t]);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Carsai Mozambique',
          text: t('partner.shareText') || 'Conheça a Carsai Mozambique — Soluções Digitais e Hospedagem Web Gratuita!',
          url: affiliateLink,
        });
      } catch (err: any) {
        // User cancelled share — not an error
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      // Fallback: copy to clipboard
      handleCopy();
    }
  };

  const handleShowQR = () => {
    setShowQR(!showQR);
  };

  const tierLabel = (tier: string) => {
    const tierMap: Record<string, string> = {
      bronze: '🥉 Bronze',
      silver: '🥈 Silver',
      gold: '🥇 Gold',
      platinum: '💎 Platinum',
      diamond: '👑 Diamond',
    };
    return tierMap[tier] || tier;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Link2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />{t('partner.affiliate')}</h2>
      </motion.div>

      {/* Affiliate Link Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3"><Link2 className="h-5 w-5 text-yellow-400" /><h3 className="font-semibold text-white">{t('partner.affiliateLink')}</h3></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-emerald-100 text-sm font-mono truncate">{affiliateLink}</div>
              <Button onClick={handleCopy} className="bg-yellow-400 hover:bg-yellow-300 text-emerald-900 font-semibold rounded-lg"><Copy className="h-4 w-4 mr-2" />{copied ? t('common.copied') : t('common.copy')}</Button>
            </div>
            <div className="flex gap-3 mt-3">
              <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-white/10" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                {t('common.share')}
              </Button>
              <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-white/10" onClick={handleShowQR}>
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('common.qrCode')}
              </Button>
            </div>
            {/* QR Code Display */}
            {showQR && (
              <div className="mt-3 bg-white rounded-xl p-4 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateLink)}&color=065f46&bgcolor=ffffff`}
                  alt="QR Code"
                  className="h-40 w-40"
                />
                <p className="text-emerald-800 text-xs mt-2 text-center">{t('partner.scanQR') || 'Scan para visitar o link de afiliado'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Overview Cards */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('partner.affiliateDetails')}</CardTitle>
              {loading && <Skeleton className="h-5 w-20" />}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.totalReferredUsers || 0}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('partner.totalReferred') || 'Total Referred'}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.totalCouponRedemptions || 0}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('partner.couponUsage') || 'Coupon Usage'}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.totalClicks || 0}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('partner.totalClicks') || 'Total Clicks'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Commission Rate & Details */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />{t('partner.commissionOverview') || 'Commission Overview'}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.commissionRate || 0.5}%</p>
                  <p className="text-sm text-muted-foreground">{t('partner.commissionRate') || 'Commission Rate'}</p>
                  <Badge className="mt-1 bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                    {tierLabel(stats?.partnerTier || 'bronze')}
                  </Badge>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats?.totalCommission || 0)}</p>
                  <p className="text-sm text-muted-foreground">{t('partner.totalCommission') || 'Total Commission'}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{t('partner.cookieDurationValue')}</p>
                  <p className="text-sm text-muted-foreground">{t('partner.cookieDuration')}</p>
                </div>
              </div>
            )}

            {/* Commission Breakdown */}
            {stats && !loading && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('partner.fromServices') || 'From Services'}</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.commissionFromServices)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('partner.fromCoupons') || 'From Coupons'}</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.commissionFromCoupons)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Referrals */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {t('partner.recentReferrals') || 'Recent Referrals'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentReferredUsers && stats.recentReferredUsers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentReferredUsers.map((referral) => (
                  <div key={referral.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50/50 dark:bg-emerald-950/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                      {referral.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{referral.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{referral.email || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(referral.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('partner.noReferrals') || 'No referrals yet'}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('partner.shareToStart') || 'Share your affiliate link to start earning'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
