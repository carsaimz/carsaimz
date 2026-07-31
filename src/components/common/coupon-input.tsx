'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

// ── Types ──
interface CouponValidationResult {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    type: string;
    value: number;
    description: string;
    expiresAt: string;
  } | null;
  discount: number;
  message: string;
}

interface CouponInputProps {
  referenceId?: string;
  referenceType?: 'service' | 'project' | 'quote';
  onApplied?: (discountInfo: { discount: number; couponCode: string; couponType: string; couponValue: number }) => void;
}

export function CouponInput({ referenceId, referenceType, onApplied }: CouponInputProps) {
  const { t } = useLanguage();
  const { idToken } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);
  const [applied, setApplied] = useState(false);

  // Validate coupon
  const handleValidate = async () => {
    if (!code.trim() || !idToken) return;
    setLoading(true);
    setValidationResult(null);
    setApplied(false);

    try {
      const body: Record<string, string> = { code: code.trim().toUpperCase() };
      if (referenceId) body.serviceId = referenceId;

      const res = await apiFetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await safeJson<any>(res);
      if (data?.success) {
        setValidationResult(data);
      } else {
        setValidationResult({
          valid: false,
          coupon: null,
          discount: 0,
          message: data?.message || t('coupon.invalid'),
        });
      }
    } catch (err: any) {
      setValidationResult({
        valid: false,
        coupon: null,
        discount: 0,
        message: err.message || t('coupon.invalid'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply coupon
  const handleApply = async () => {
    if (!validationResult?.valid || !validationResult.coupon || !idToken) return;
    if (!referenceId || !referenceType) {
      // Can't apply without reference
      if (onApplied) {
        onApplied({
          discount: validationResult.discount,
          couponCode: validationResult.coupon.code,
          couponType: validationResult.coupon.type,
          couponValue: validationResult.coupon.value,
        });
      }
      setApplied(true);
      return;
    }

    setApplying(true);
    try {
      const res = await apiFetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: validationResult.coupon.code,
          referenceId,
          referenceType,
        }),
      });

      const data = await safeJson<any>(res);
      if (data?.success) {
        setApplied(true);
        if (onApplied) {
          onApplied({
            discount: data.discount || validationResult.discount,
            couponCode: validationResult.coupon.code,
            couponType: validationResult.coupon.type,
            couponValue: validationResult.coupon.value,
          });
        }
      }
    } catch (err) {
      console.error('[CouponInput] Apply failed:', err);
    } finally {
      setApplying(false);
    }
  };

  // Reset state
  const handleReset = () => {
    setCode('');
    setValidationResult(null);
    setApplied(false);
  };

  return (
    <div className="space-y-3">
      {/* Input Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setValidationResult(null); setApplied(false); }}
            placeholder={t('coupon.enterCode')}
            className="pl-9 uppercase"
            disabled={loading || applied}
            onKeyDown={(e) => { if (e.key === 'Enter') handleValidate(); }}
          />
        </div>
        {!applied ? (
          <Button
            onClick={validationResult?.valid ? handleApply : handleValidate}
            disabled={loading || applying || !code.trim()}
            className="gap-2"
          >
            {(loading || applying) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : validationResult?.valid ? (
              <ArrowRight className="h-4 w-4" />
            ) : null}
            {validationResult?.valid ? t('coupon.apply') : t('coupon.validate')}
          </Button>
        ) : (
          <Button variant="outline" onClick={handleReset} className="gap-2">
            {t('coupon.change')}
          </Button>
        )}
      </div>

      {/* Validation Result */}
      <AnimatePresence mode="wait">
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {validationResult.valid && !applied ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {t('coupon.valid')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {validationResult.coupon?.type === 'percentage'
                      ? t('coupon.discountPercent', { value: validationResult.discount })
                      : t('coupon.discountFixed', { value: validationResult.discount.toLocaleString() })}
                  </p>
                </div>
              </div>
            ) : validationResult.valid && applied ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {t('coupon.applied')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {validationResult.coupon?.type === 'percentage'
                      ? t('coupon.discountPercent', { value: validationResult.discount })
                      : t('coupon.discountFixed', { value: validationResult.discount.toLocaleString() })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">
                  {validationResult.message || t('coupon.invalid')}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
