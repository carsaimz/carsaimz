'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, ExternalLink, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { APP_PUBLIC_URL } from '@/lib/client-config';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

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
  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const affiliateLink = `${getAffiliateBaseUrl()}/ref/${user?.id || 'demo-partner-001'}`;

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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Link2 className="h-6 w-6 text-emerald-600" />{t('partner.affiliate')}</h2>
      </motion.div>

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

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle>{t('partner.affiliateDetails')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-emerald-50"><p className="text-2xl font-bold text-emerald-700">{t('partner.commissionRateValue')}</p><p className="text-sm text-muted-foreground">{t('partner.commissionRate')}</p></div>
              <div className="text-center p-4 rounded-xl bg-emerald-50"><p className="text-2xl font-bold text-emerald-700">{t('partner.cookieDurationValue')}</p><p className="text-sm text-muted-foreground">{t('partner.cookieDuration')}</p></div>
              <div className="text-center p-4 rounded-xl bg-emerald-50"><Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('partner.goldTier')}</Badge><p className="text-sm text-muted-foreground mt-1">{t('partner.currentLevel')}</p></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
