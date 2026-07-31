'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Save,
  Trash2,
  Settings2,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Wallet,
  Banknote,
  Smartphone,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ProviderConfig {
  // Stripe
  stripePublicKey?: string | null;
  stripeSecretKey?: string | null;
  stripeWebhookSecret?: string | null;
  // PayPal
  paypalClientId?: string | null;
  paypalClientSecret?: string | null;
  paypalWebhookId?: string | null;
  // M-Pesa
  mpesaApiKey?: string | null;
  mpesaPublicKey?: string | null;
  mpesaServiceProviderCode?: string | null;
  // e-Mola
  emolaApiKey?: string | null;
  emolaMerchantId?: string | null;
  // Bank Transfer
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  bankInstructions?: string | null;
}

interface PaymentProvider {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isTestMode: boolean;
  config: ProviderConfig;
  supportedCurrencies: string[];
  processingFee: number;
  processingFeeFixed: number;
  minAmount: number;
  maxAmount: number;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  stripe: <CreditCard className="size-5" />,
  paypal: <Wallet className="size-5" />,
  mpesa: <Smartphone className="size-5" />,
  emola: <Smartphone className="size-5" />,
  bank_transfer: <Building2 className="size-5" />,
};

const PROVIDER_COLORS: Record<string, string> = {
  stripe: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  paypal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  mpesa: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  emola: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  bank_transfer: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
};

const CURRENCY_OPTIONS = ['MZN', 'USD', 'EUR', 'ZAR', 'BRL'];

export function AdminPaymentProviders() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [configForm, setConfigForm] = useState<ProviderConfig>({});
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentProvider | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/payments/providers');
      const data = await safeJson(res);
      if (data && data.success) {
        setProviders(data.data || []);
      }
    } catch (err) {
      console.error('Fetch payment providers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleToggleActive = async (provider: PaymentProvider, isActive: boolean) => {
    try {
      const res = await apiFetch('/api/admin/payments/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: provider.id, isActive }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.itemUpdated') || 'Updated', description: isActive ? 'Provider activated' : 'Provider deactivated' });
        fetchProviders();
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update provider', variant: 'destructive' });
    }
  };

  const handleToggleTestMode = async (provider: PaymentProvider, isTestMode: boolean) => {
    try {
      const res = await apiFetch('/api/admin/payments/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: provider.id, isTestMode }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.itemUpdated') || 'Updated', description: isTestMode ? 'Test mode enabled' : 'Test mode disabled' });
        fetchProviders();
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update provider', variant: 'destructive' });
    }
  };

  const handleSaveConfig = async () => {
    if (!editingProvider) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/payments/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProvider.id,
          config: configForm,
          ...settingsForm,
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.itemUpdated') || 'Updated', description: 'Provider configuration saved' });
        setEditingProvider(null);
        fetchProviders();
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to save configuration', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/admin/payments/providers?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.itemDeleted') || 'Deleted', description: 'Provider deleted' });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        fetchProviders();
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to delete provider', variant: 'destructive' });
    }
  };

  const handleTestConnection = async (provider: PaymentProvider) => {
    setTesting(provider.id);
    try {
      let testResult = false;
      let message = '';

      switch (provider.name) {
        case 'stripe': {
          if (!provider.config?.stripeSecretKey) {
            message = 'Stripe secret key is not configured';
          } else {
            try {
              const res = await apiFetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: 1,
                  currency: 'MZN',
                  providerId: provider.id,
                  description: 'Test connection',
                  userId: 'test',
                }),
              });
              const data = await safeJson(res);
              testResult = data?.success && !data?.data?.providerData?.requiresConfiguration;
              message = testResult ? 'Stripe connection successful!' : (data?.data?.providerData?.error || data?.message || 'Connection failed');
            } catch (err: any) {
              message = err.message || 'Connection test failed';
            }
          }
          break;
        }
        case 'paypal': {
          if (!provider.config?.paypalClientId || !provider.config?.paypalClientSecret) {
            message = 'PayPal credentials are not configured';
          } else {
            message = 'PayPal credentials configured. Test by creating a test payment.';
            testResult = true;
          }
          break;
        }
        case 'mpesa': {
          if (!provider.config?.mpesaApiKey || !provider.config?.mpesaPublicKey) {
            message = 'M-Pesa credentials are not configured';
          } else {
            message = 'M-Pesa credentials configured. Test by initiating a C2B payment.';
            testResult = true;
          }
          break;
        }
        case 'emola': {
          if (!provider.config?.emolaApiKey || !provider.config?.emolaMerchantId) {
            message = 'e-Mola credentials are not configured';
          } else {
            message = 'e-Mola credentials configured. Test by initiating a payment.';
            testResult = true;
          }
          break;
        }
        case 'bank_transfer': {
          if (!provider.config?.bankName || !provider.config?.bankAccountNumber) {
            message = 'Bank details are not configured';
          } else {
            message = 'Bank transfer details configured.';
            testResult = true;
          }
          break;
        }
        default:
          message = 'Unknown provider type';
      }

      toast({
        title: testResult ? 'Connection Test' : 'Test Failed',
        description: message,
        variant: testResult ? 'default' : 'destructive',
      });
    } catch (err) {
      toast({ title: 'Test Error', description: 'Failed to test connection', variant: 'destructive' });
    } finally {
      setTesting(null);
    }
  };

  const openConfigEditor = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setConfigForm({ ...provider.config });
    setSettingsForm({
      displayName: provider.displayName,
      description: provider.description,
      processingFee: provider.processingFee,
      processingFeeFixed: provider.processingFeeFixed,
      minAmount: provider.minAmount,
      maxAmount: provider.maxAmount,
      supportedCurrencies: provider.supportedCurrencies,
      order: provider.order,
    });
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string | null | undefined): string => {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return '••••••••' + value.slice(-4);
  };

  const renderConfigFields = (providerName: string) => {
    switch (providerName) {
      case 'stripe':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Public Key (pk_...)</Label>
              <div className="relative">
                <Input
                  type={showSecrets['stripePublicKey'] ? 'text' : 'password'}
                  placeholder="pk_test_..."
                  value={configForm.stripePublicKey || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, stripePublicKey: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => toggleSecretVisibility('stripePublicKey')}
                >
                  {showSecrets['stripePublicKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Secret Key (sk_...)</Label>
              <div className="relative">
                <Input
                  type={showSecrets['stripeSecretKey'] ? 'text' : 'password'}
                  placeholder="sk_test_..."
                  value={configForm.stripeSecretKey || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => toggleSecretVisibility('stripeSecretKey')}
                >
                  {showSecrets['stripeSecretKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Webhook Secret (whsec_...)</Label>
              <div className="relative">
                <Input
                  type={showSecrets['stripeWebhookSecret'] ? 'text' : 'password'}
                  placeholder="whsec_..."
                  value={configForm.stripeWebhookSecret || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => toggleSecretVisibility('stripeWebhookSecret')}
                >
                  {showSecrets['stripeWebhookSecret'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'paypal':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Client ID</Label>
              <div className="relative">
                <Input
                  type={showSecrets['paypalClientId'] ? 'text' : 'password'}
                  placeholder="PayPal Client ID"
                  value={configForm.paypalClientId || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, paypalClientId: e.target.value }))}
                  className="pr-10"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('paypalClientId')}>
                  {showSecrets['paypalClientId'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Client Secret</Label>
              <div className="relative">
                <Input
                  type={showSecrets['paypalClientSecret'] ? 'text' : 'password'}
                  placeholder="PayPal Client Secret"
                  value={configForm.paypalClientSecret || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, paypalClientSecret: e.target.value }))}
                  className="pr-10"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('paypalClientSecret')}>
                  {showSecrets['paypalClientSecret'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Webhook ID</Label>
              <Input
                placeholder="PayPal Webhook ID"
                value={configForm.paypalWebhookId || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, paypalWebhookId: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'mpesa':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key</Label>
              <div className="relative">
                <Input
                  type={showSecrets['mpesaApiKey'] ? 'text' : 'password'}
                  placeholder="M-Pesa API Key"
                  value={configForm.mpesaApiKey || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, mpesaApiKey: e.target.value }))}
                  className="pr-10"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('mpesaApiKey')}>
                  {showSecrets['mpesaApiKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Public Key</Label>
              <div className="relative">
                <Input
                  type={showSecrets['mpesaPublicKey'] ? 'text' : 'password'}
                  placeholder="M-Pesa Public Key"
                  value={configForm.mpesaPublicKey || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, mpesaPublicKey: e.target.value }))}
                  className="pr-10"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('mpesaPublicKey')}>
                  {showSecrets['mpesaPublicKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Provider Code</Label>
              <Input
                placeholder="e.g., 171717"
                value={configForm.mpesaServiceProviderCode || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, mpesaServiceProviderCode: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'emola':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key</Label>
              <div className="relative">
                <Input
                  type={showSecrets['emolaApiKey'] ? 'text' : 'password'}
                  placeholder="e-Mola API Key"
                  value={configForm.emolaApiKey || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, emolaApiKey: e.target.value }))}
                  className="pr-10"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('emolaApiKey')}>
                  {showSecrets['emolaApiKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Merchant ID</Label>
              <Input
                placeholder="e-Mola Merchant ID"
                value={configForm.emolaMerchantId || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, emolaMerchantId: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.bankName') || 'Bank Name'}</Label>
              <Input
                placeholder="e.g., Millennium BIM"
                value={configForm.bankName || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, bankName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.accountName') || 'Account Name'}</Label>
              <Input
                placeholder="Account holder name"
                value={configForm.bankAccountName || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, bankAccountName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.accountNumber') || 'Account Number'}</Label>
              <Input
                placeholder="Bank account number"
                value={configForm.bankAccountNumber || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">IBAN</Label>
              <Input
                placeholder="e.g., MZ59..."
                value={configForm.bankIban || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, bankIban: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.instructions') || 'Instructions'}</Label>
              <Textarea
                placeholder="Payment instructions for the customer..."
                value={configForm.bankInstructions || ''}
                onChange={(e) => setConfigForm(prev => ({ ...prev, bankInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No configuration fields for this provider</p>;
    }
  };

  const hasConfiguredKeys = (provider: PaymentProvider): boolean => {
    switch (provider.name) {
      case 'stripe':
        return !!(provider.config?.stripeSecretKey && provider.config?.stripePublicKey);
      case 'paypal':
        return !!(provider.config?.paypalClientId && provider.config?.paypalClientSecret);
      case 'mpesa':
        return !!(provider.config?.mpesaApiKey && provider.config?.mpesaPublicKey);
      case 'emola':
        return !!(provider.config?.emolaApiKey && provider.config?.emolaMerchantId);
      case 'bank_transfer':
        return !!(provider.config?.bankName && provider.config?.bankAccountNumber);
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-red-600" />
            {t('payment.providers') || 'Payment Providers'}
          </h2>
          <Button variant="outline" size="sm" onClick={fetchProviders} className="gap-1">
            <RefreshCw className="size-4" />
            {t('common.refresh') || 'Refresh'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t('payment.providersDesc') || 'Configure payment providers for accepting payments. Enable/disable providers and set up API keys.'}
        </p>
      </motion.div>

      {/* Provider List */}
      {providers.map((provider) => (
        <motion.div key={provider.id} variants={itemVariants}>
          <Card className={`${provider.isActive ? 'border-emerald-200/60 dark:border-emerald-800/60' : 'border-muted opacity-70'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`size-12 rounded-xl ${PROVIDER_COLORS[provider.name] || 'bg-muted'} flex items-center justify-center shrink-0`}>
                  {PROVIDER_ICONS[provider.name] || <CreditCard className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-lg">{provider.displayName}</span>
                    <Badge variant="outline" className="text-xs">{provider.name}</Badge>
                    {provider.isActive ? (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 text-xs">
                        <CheckCircle2 className="size-3 mr-1" />
                        {t('common.active') || 'Active'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="size-3 mr-1" />
                        {t('common.inactive') || 'Inactive'}
                      </Badge>
                    )}
                    {provider.isTestMode && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                        <TestTube className="size-3 mr-1" />
                        {t('payment.testMode') || 'Test Mode'}
                      </Badge>
                    )}
                    {!hasConfiguredKeys(provider) && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                        <AlertCircle className="size-3 mr-1" />
                        {t('payment.notConfigured') || 'Not Configured'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{t('payment.fee') || 'Fee'}: {provider.processingFee}%{provider.processingFeeFixed > 0 ? ` + ${provider.processingFeeFixed}` : ''}</span>
                    <span>•</span>
                    <span>{t('payment.currencies') || 'Currencies'}: {provider.supportedCurrencies.join(', ')}</span>
                    {provider.minAmount > 0 && (
                      <>
                        <span>•</span>
                        <span>Min: {provider.minAmount}</span>
                      </>
                    )}
                    {provider.maxAmount > 0 && (
                      <>
                        <span>•</span>
                        <span>Max: {provider.maxAmount}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleTestConnection(provider)}
                    disabled={testing === provider.id}
                    title={t('payment.testConnection') || 'Test Connection'}
                  >
                    {testing === provider.id ? <Loader2 className="size-4 animate-spin" /> : <TestTube className="size-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleActive(provider, !provider.isActive)}
                    title={provider.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {provider.isActive ? (
                      <ToggleRight className="size-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="size-5 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => openConfigEditor(provider)}
                    title={t('common.settings') || 'Configure'}
                  >
                    <Settings2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setDeleteTarget(provider); setDeleteDialogOpen(true); }}
                    title={t('common.delete') || 'Delete'}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Empty State */}
      {providers.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-200/60 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4 text-center">
              <Banknote className="size-12 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold mb-2">{t('payment.noProviders') || 'No Payment Providers'}</h3>
              <p className="text-sm text-muted-foreground">
                {t('payment.noProvidersDesc') || 'No payment providers found. Click refresh to initialize default providers.'}
              </p>
              <Button className="mt-4" onClick={fetchProviders} variant="outline">
                <RefreshCw className="size-4 mr-2" />
                {t('common.refresh') || 'Refresh'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security Notice */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="size-4 text-emerald-500" />
              {t('payment.securityNotice') || 'Security Notice'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('payment.securityNoticeDesc') || 'All API keys and secrets are stored securely in Firestore and are never exposed to the client. Only public keys (like Stripe publishable key) are sent to the frontend. Secret keys are always masked in the admin interface.'}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                <strong>Stripe Webhook URL:</strong> <code className="bg-muted px-1 rounded">/api/payments/webhook/stripe</code>
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>PayPal Webhook URL:</strong> <code className="bg-muted px-1 rounded">/api/payments/webhook/paypal</code>
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>M-Pesa Callback URL:</strong> <code className="bg-muted px-1 rounded">/api/payments/webhook/mpesa</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuration Dialog */}
      <Dialog open={!!editingProvider} onOpenChange={(open) => { if (!open) setEditingProvider(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProvider && PROVIDER_ICONS[editingProvider.name]}
              {t('payment.configureProvider') || 'Configure'} {editingProvider?.displayName}
            </DialogTitle>
            <DialogDescription>
              {t('payment.configureProviderDesc') || 'Configure API keys and settings for this payment provider.'}
            </DialogDescription>
          </DialogHeader>
          <Separator />

          {editingProvider && (
            <div className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {t('admin.generalSettings') || 'General Settings'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('admin.name') || 'Display Name'}</Label>
                    <Input
                      value={settingsForm.displayName || ''}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, displayName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('admin.description') || 'Description'}</Label>
                    <Input
                      value={settingsForm.description || ''}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('admin.order') || 'Order'}</Label>
                    <Input
                      type="number"
                      value={settingsForm.order || 0}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* API Configuration */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {t('payment.apiConfiguration') || 'API Configuration'}
                </h4>
                {renderConfigFields(editingProvider.name)}
              </div>

              <Separator />

              {/* Fee Configuration */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {t('payment.feeConfiguration') || 'Fee Configuration'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.processingFee') || 'Processing Fee (%)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settingsForm.processingFee || 0}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, processingFee: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.fixedFee') || 'Fixed Fee'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settingsForm.processingFeeFixed || 0}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, processingFeeFixed: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.minAmount') || 'Min Amount'}</Label>
                    <Input
                      type="number"
                      value={settingsForm.minAmount || 0}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.maxAmount') || 'Max Amount (0 = unlimited)'}</Label>
                    <Input
                      type="number"
                      value={settingsForm.maxAmount || 0}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {/* Supported Currencies */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('payment.supportedCurrencies') || 'Supported Currencies'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCY_OPTIONS.map((currency) => {
                      const isSelected = (settingsForm.supportedCurrencies || []).includes(currency);
                      return (
                        <Button
                          key={currency}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={isSelected ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                          onClick={() => {
                            const current = settingsForm.supportedCurrencies || [];
                            const updated = isSelected
                              ? current.filter((c: string) => c !== currency)
                              : [...current, currency];
                            setSettingsForm(prev => ({ ...prev, supportedCurrencies: updated }));
                          }}
                        >
                          {currency}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Test Mode Toggle */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editingProvider.isTestMode}
                    onCheckedChange={(checked) => {
                      handleToggleTestMode(editingProvider, checked);
                    }}
                  />
                  <Label className="text-sm font-medium">
                    <TestTube className="size-4 inline mr-1" />
                    {t('payment.testMode') || 'Test Mode'}
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingProvider(null)}>
              {t('admin.cancel') || 'Cancel'}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              {t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.deleteItem') || 'Delete Provider'}</DialogTitle>
            <DialogDescription>
              {t('admin.confirmDelete') || 'Are you sure you want to delete this provider?'}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('payment.deleteWarning') || 'This will permanently delete'} <strong>{deleteTarget?.displayName}</strong>. {t('payment.deleteWarningAction') || 'This action cannot be undone.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('admin.cancel') || 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete') || 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
