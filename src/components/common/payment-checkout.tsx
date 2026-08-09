'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Copy,
  Phone,
  ExternalLink,
  Banknote,
  RefreshCw,
  Hash,
  QrCode,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { convertFromMZN, getBestCurrencyForProvider, formatConvertedAmount, CURRENCIES } from '@/lib/currency';

// ─── Types ───

interface PaymentProviderInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isTestMode: boolean;
  config: Record<string, any>;
  supportedCurrencies: string[];
  processingFee: number;
  processingFeeFixed: number;
  minAmount: number;
  maxAmount: number;
  order: number;
}

interface PaymentCheckoutProps {
  amount: number;
  currency: string;
  description?: string;
  userId?: string;
  metadata?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

type PaymentStep = 'select-provider' | 'payment-form' | 'processing' | 'success' | 'error';

// ─── Provider Icons ───

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  stripe: <CreditCard className="size-5" />,
  paypal: <Wallet className="size-5" />,
  mpesa: <Smartphone className="size-5" />,
  emola: <Smartphone className="size-5" />,
  bank_transfer: <Building2 className="size-5" />,
  manual_transfer: <Building2 className="size-5" />,
  pos: <CreditCard className="size-5" />,
  merchant_code: <Hash className="size-5" />,
  qr_payment: <QrCode className="size-5" />,
};

const PROVIDER_COLORS: Record<string, string> = {
  stripe: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400',
  paypal: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400',
  mpesa: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-400',
  emola: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400',
  bank_transfer: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400',
  manual_transfer: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400',
  pos: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 hover:border-sky-400',
  merchant_code: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400',
  qr_payment: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-400',
};

// ─── Component ───

export function PaymentCheckout({
  amount,
  currency,
  description,
  userId,
  metadata,
  onSuccess,
  onError,
  onCancel,
}: PaymentCheckoutProps) {
  const { t, formatCurrency } = useLanguage();
  const { toast } = useToast();

  const [providers, setProviders] = useState<PaymentProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<PaymentStep>('select-provider');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderInfo | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [verificationInterval, setVerificationInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch active providers
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/payments/providers');
      const data = await safeJson(res);
      if (data && data.success) {
        // Show active providers that either support MZN directly or
        // support a currency we can convert to from MZN
        const activeProviders = (data.data || []).filter(
          (p: PaymentProviderInfo) => {
            if (!p.isActive) return false;
            // Provider supports MZN directly — no conversion needed
            if (p.supportedCurrencies?.includes('MZN')) return true;
            // Provider supports a currency we can convert MZN to
            const bestCurrency = getBestCurrencyForProvider(p.supportedCurrencies || []);
            return bestCurrency !== 'MZN' && CURRENCIES[bestCurrency] !== undefined;
          }
        );
        setProviders(activeProviders);
      }
    } catch (err) {
      console.error('Fetch providers error:', err);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [verificationInterval]);

  // Calculate fee for a provider (in the provider's currency)
  const calculateFee = (provider: PaymentProviderInfo): number => {
    const providerCurrency = getBestCurrencyForProvider(provider.supportedCurrencies || []);
    const convertedAmount = convertFromMZN(amount, providerCurrency);
    const percentageFee = (convertedAmount * provider.processingFee) / 100;
    const fixedFee = provider.processingFeeFixed || 0;
    return Math.round((percentageFee + fixedFee) * 100) / 100;
  };

  // Get the provider's currency for display
  const getProviderCurrency = (provider: PaymentProviderInfo): string => {
    return getBestCurrencyForProvider(provider.supportedCurrencies || []);
  };

  // Format amount in the provider's currency
  const formatProviderAmount = (amountMZN: number, provider: PaymentProviderInfo): string => {
    const providerCurrency = getProviderCurrency(provider);
    return formatConvertedAmount(amountMZN, providerCurrency);
  };

  // Create payment
  const handleCreatePayment = async () => {
    if (!selectedProvider) return;

    // For mobile money providers, validate phone number
    if ((selectedProvider.name === 'mpesa' || selectedProvider.name === 'emola') && !phoneNumber) {
      toast({ title: t('payment.phoneNumberRequired') || 'Phone number required', variant: 'destructive' });
      return;
    }

    setStep('processing');
    setProcessing(true);

    try {
      const paymentMetadata = {
        ...metadata,
        ...(phoneNumber ? { phoneNumber } : {}),
      };

      // Determine the currency to use for this provider
      const providerCurrency = getProviderCurrency(selectedProvider);
      const convertedAmount = convertFromMZN(amount, providerCurrency);

      const res = await apiFetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: providerCurrency === 'MZN' ? amount : convertedAmount,
          currency: providerCurrency,
          originalAmount: amount,
          originalCurrency: 'MZN',
          providerId: selectedProvider.id,
          description: description || '',
          userId: userId || 'guest',
          metadata: paymentMetadata,
        }),
      });

      const data = await safeJson(res);

      if (!data || !data.success) {
        const errorMsg = data?.message || data?.data?.providerData?.error || 'Payment creation failed';
        setStep('error');
        setErrorMessage(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setPaymentData(data.data);

      // Handle based on provider type
      const providerResult = data.data?.providerData || {};

      if (providerResult.requiresConfiguration) {
        setStep('error');
        setErrorMessage(t('payment.providerNotConfigured') || 'Payment provider is not configured. Please contact support.');
        onError?.(providerResult.message || 'Provider not configured');
        return;
      }

      switch (selectedProvider.name) {
        case 'stripe': {
          // Stripe returns clientSecret — we'd use Stripe.js Elements
          // For now, show the payment data and let the parent handle it
          if (providerResult.clientSecret) {
            // Start polling for payment status
            startPaymentVerification(data.data.paymentId);
            // Return the Stripe data to the parent
            onSuccess?.({
              ...data.data,
              providerData: providerResult,
              type: 'stripe',
            });
          } else {
            setStep('error');
            setErrorMessage('Stripe payment could not be initiated');
            onError?.('Stripe payment failed');
          }
          break;
        }

        case 'paypal': {
          // PayPal returns approval URL — redirect user
          if (providerResult.approvalUrl) {
            window.open(providerResult.approvalUrl, '_blank');
            // Start polling for payment status
            startPaymentVerification(data.data.paymentId);
            // Show waiting screen
            setStep('processing');
          } else {
            setStep('error');
            setErrorMessage('PayPal payment could not be initiated');
            onError?.('PayPal payment failed');
          }
          break;
        }

        case 'mpesa':
        case 'emola': {
          // Mobile money — show waiting screen while polling
          startPaymentVerification(data.data.paymentId);
          setStep('processing');
          toast({
            title: t('payment.checkPhone') || 'Check your phone',
            description: t('payment.checkPhoneDesc') || 'A payment prompt has been sent to your phone. Please confirm the payment.',
          });
          break;
        }

        case 'bank_transfer':
        case 'manual_transfer':
        case 'pos':
        case 'merchant_code':
        case 'qr_payment': {
          // Manual payment methods — show instructions
          setStep('payment-form');
          break;
        }
      }
    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message || 'Payment creation failed');
      onError?.(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Poll for payment status
  const startPaymentVerification = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        });

        const data = await safeJson(res);
        if (data && data.success) {
          if (data.status === 'completed') {
            clearInterval(interval);
            setVerificationInterval(null);
            setStep('success');
            onSuccess?.(data.data);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            setVerificationInterval(null);
            setStep('error');
            setErrorMessage(t('payment.paymentFailed') || 'Payment failed');
            onError?.('Payment failed');
          }
        }
      } catch (err) {
        // Continue polling on error
      }
    }, 5000); // Poll every 5 seconds

    setVerificationInterval(interval);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: t('common.copied') || 'Copied!' });
    });
  };

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
        <span className="ml-2 text-muted-foreground">{t('common.loading') || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Payment Summary */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('payment.paymentAmount') || 'Payment Amount'}</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</p>
              {selectedProvider && getProviderCurrency(selectedProvider) !== 'MZN' && (
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ {formatConvertedAmount(amount, getProviderCurrency(selectedProvider))}
                </p>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <Banknote className="size-10 text-emerald-400" />
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Provider */}
        {step === 'select-provider' && (
          <motion.div
            key="select-provider"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <h3 className="font-semibold text-lg">
              {t('payment.selectProvider') || 'Select Payment Method'}
            </h3>

            {providers.length === 0 ? (
              <Card>
                <CardContent className="pt-4 text-center">
                  <AlertCircle className="size-8 mx-auto text-amber-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('payment.noProvidersAvailable') || 'No payment providers available for this currency.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => {
                const providerCurrency = getProviderCurrency(provider);
                const convertedAmount = convertFromMZN(amount, providerCurrency);
                const fee = calculateFee(provider);
                const totalConverted = convertedAmount + fee;
                const isSelected = selectedProvider?.id === provider.id;
                const needsConversion = providerCurrency !== 'MZN';

                return (
                  <Card
                    key={provider.id}
                    className={`cursor-pointer transition-all ${
                      PROVIDER_COLORS[provider.name] || 'border-muted'
                    } ${isSelected ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-white/80 dark:bg-black/20 flex items-center justify-center shrink-0">
                          {PROVIDER_ICONS[provider.name] || <CreditCard className="size-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{provider.displayName}</span>
                            {provider.isTestMode && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">
                                {t('payment.testMode') || 'Test'}
                              </Badge>
                            )}
                            {needsConversion && (
                              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                                {providerCurrency}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{provider.description}</p>
                          {needsConversion && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(amount)} ≈ {formatConvertedAmount(amount, providerCurrency)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {fee > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground">
                                {t('payment.fee') || 'Fee'}: {formatProviderAmount(fee, provider)}
                              </p>
                              <p className="text-sm font-semibold">
                                {t('payment.total') || 'Total'}: {formatProviderAmount(amount, provider)} + {formatProviderAmount(fee, provider)}
                              </p>
                            </>
                          ) : (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                              {t('payment.noFee') || 'No fee'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Phone Number Input for Mobile Money */}
            {selectedProvider && (selectedProvider.name === 'mpesa' || selectedProvider.name === 'emola') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium">
                  <Phone className="size-4 inline mr-1" />
                  {t('payment.phoneNumber') || 'Phone Number'}
                </Label>
                <Input
                  type="tel"
                  placeholder="84XXXXXXX ou 85XXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="focus-visible:ring-emerald-500"
                />
                <p className="text-xs text-muted-foreground">
                  {t('payment.phoneNumberHint') || 'Enter the phone number associated with your mobile money account'}
                </p>
              </motion.div>
            )}

            {/* Pay Button */}
            {selectedProvider && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                  onClick={handleCreatePayment}
                  disabled={
                    processing ||
                    ((selectedProvider.name === 'mpesa' || selectedProvider.name === 'emola') && !phoneNumber)
                  }
                >
                  {processing ? (
                    <Loader2 className="size-5 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="size-5 mr-2" />
                  )}
                  {t('payment.payWith') || 'Pay with'} {selectedProvider.displayName}
                  {' — '}
                  {formatProviderAmount(amount, selectedProvider)}
                  {(() => {
                    const providerCurrency = getProviderCurrency(selectedProvider);
                    const fee = calculateFee(selectedProvider);
                    if (fee > 0) {
                      return ` + ${formatProviderAmount(fee, selectedProvider)} ${t('payment.fee') || 'fee'}`;
                    }
                    return '';
                  })()}
                </Button>
              </motion.div>
            )}

            {/* Cancel Button */}
            {onCancel && (
              <Button variant="ghost" className="w-full" onClick={onCancel}>
                {t('admin.cancel') || 'Cancel'}
              </Button>
            )}
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <Loader2 className="size-12 mx-auto animate-spin text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-lg">{t('payment.processing') || 'Processing Payment'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProvider?.name === 'paypal'
                      ? t('payment.paypalRedirect') || 'Please complete the payment in the PayPal window'
                      : selectedProvider?.name === 'mpesa' || selectedProvider?.name === 'emola'
                        ? t('payment.checkPhoneDesc') || 'A payment prompt has been sent to your phone. Please confirm the payment.'
                        : t('payment.pleaseWait') || 'Please wait while we process your payment...'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (verificationInterval) {
                      clearInterval(verificationInterval);
                      setVerificationInterval(null);
                    }
                    setStep('select-provider');
                  }}
                >
                  {t('payment.cancelPayment') || 'Cancel'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Manual Payment Instructions (bank_transfer, manual_transfer, pos, merchant_code, qr_payment) */}
        {step === 'payment-form' && selectedProvider && paymentData && ['bank_transfer', 'manual_transfer', 'pos', 'merchant_code', 'qr_payment'].includes(selectedProvider.name) && (
          <motion.div
            key="bank-transfer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {selectedProvider.name === 'qr_payment' ? <QrCode className="size-5 text-teal-600" /> :
                   selectedProvider.name === 'merchant_code' ? <Hash className="size-5 text-indigo-600" /> :
                   selectedProvider.name === 'pos' ? <CreditCard className="size-5 text-sky-600" /> :
                   <Building2 className="size-5 text-amber-600" />}
                  {selectedProvider.name === 'bank_transfer' ? (t('payment.bankTransferDetails') || 'Bank Transfer Details') :
                   selectedProvider.name === 'manual_transfer' ? (t('payment.manualTransferDetails') || 'Manual Transfer Instructions') :
                   selectedProvider.name === 'pos' ? (t('payment.posPaymentDetails') || 'POS Payment Instructions') :
                   selectedProvider.name === 'merchant_code' ? (t('payment.merchantCodeDetails') || 'Merchant Code Payment') :
                   selectedProvider.name === 'qr_payment' ? (t('payment.qrPaymentDetails') || 'QR Code Payment') :
                   selectedProvider.displayName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {paymentData.providerData?.message || t('payment.bankTransferInstructions') || 'Please follow the instructions below and send proof of payment.'}
                </p>

                <div className="space-y-3">
                  {/* Bank Transfer specific fields */}
                  {selectedProvider.name === 'bank_transfer' && (
                    <>
                      {paymentData.providerData?.bankName && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t('payment.bankName') || 'Bank'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{paymentData.providerData.bankName}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.providerData.bankName)}>
                              <Copy className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {paymentData.providerData?.accountName && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t('payment.accountName') || 'Account Name'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{paymentData.providerData.accountName}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.providerData.accountName)}>
                              <Copy className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {paymentData.providerData?.accountNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t('payment.accountNumber') || 'Account Number'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium font-mono">{paymentData.providerData.accountNumber}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.providerData.accountNumber)}>
                              <Copy className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {paymentData.providerData?.iban && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">IBAN</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium font-mono">{paymentData.providerData.iban}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.providerData.iban)}>
                              <Copy className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* POS terminal ID */}
                  {selectedProvider.name === 'pos' && paymentData.providerData?.terminalId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('payment.terminalId') || 'Terminal ID'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono">{paymentData.providerData.terminalId}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.providerData.terminalId)}>
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Merchant Code */}
                  {selectedProvider.name === 'merchant_code' && paymentData.providerData?.merchantCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('payment.merchantCode') || 'Merchant Code'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">{paymentData.providerData.merchantCode}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.providerData.merchantCode)}>
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* QR Code image */}
                  {selectedProvider.name === 'qr_payment' && paymentData.providerData?.qrCodeUrl && (
                    <div className="flex justify-center py-4">
                      <img
                        src={paymentData.providerData.qrCodeUrl}
                        alt="QR Code for payment"
                        className="w-48 h-48 rounded-lg border"
                      />
                    </div>
                  )}

                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('payment.reference') || 'Reference'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{paymentData.paymentId}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(paymentData.paymentId)}>
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('payment.amount') || 'Amount'}</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</span>
                  </div>
                </div>

                {paymentData.providerData?.instructions && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
                    {paymentData.providerData.instructions}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setStep('select-provider');
                setPaymentData(null);
              }}
            >
              {t('common.back') || 'Back'}
            </Button>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6 text-center space-y-4">
                <CheckCircle2 className="size-16 mx-auto text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-xl text-emerald-600 dark:text-emerald-400">
                    {t('payment.paymentSuccess') || 'Payment Successful!'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('payment.paymentSuccessDesc') || 'Your payment has been processed successfully.'}
                  </p>
                </div>
                {paymentData?.paymentId && (
                  <p className="text-xs text-muted-foreground">
                    {t('payment.transactionId') || 'Transaction ID'}: <code className="bg-muted px-1 rounded">{paymentData.paymentId}</code>
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Error */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6 text-center space-y-4">
                <XCircle className="size-16 mx-auto text-red-500" />
                <div>
                  <h3 className="font-semibold text-xl text-red-600">
                    {t('payment.paymentFailed') || 'Payment Failed'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {errorMessage || t('payment.paymentFailedDesc') || 'Your payment could not be processed. Please try again.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setStep('select-provider');
                      setPaymentData(null);
                      setErrorMessage('');
                    }}
                  >
                    {t('common.retry') || 'Try Again'}
                  </Button>
                  {onCancel && (
                    <Button variant="ghost" className="flex-1" onClick={onCancel}>
                      {t('admin.cancel') || 'Cancel'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
