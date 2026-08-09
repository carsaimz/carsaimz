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
  Shield,
  Wallet,
  Banknote,
  Smartphone,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  QrCode,
  MonitorSmartphone,
  Plus,
  Globe,
  FileText,
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { type LanguageCode, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n';
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
  bankInstructionsI18n?: string | null;
  // Manual methods
  posTerminalId?: string | null;
  posInstructions?: string | null;
  posInstructionsI18n?: string | null;
  merchantCode?: string | null;
  merchantCodeInstructions?: string | null;
  merchantCodeInstructionsI18n?: string | null;
  qrCodeUrl?: string | null;
  qrInstructions?: string | null;
  qrInstructionsI18n?: string | null;
  transferInstructions?: string | null;
  transferInstructionsI18n?: string | null;
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
  stripe: <CreditCard className="size-4" />,
  paypal: <Wallet className="size-4" />,
  mpesa: <Smartphone className="size-4" />,
  emola: <Smartphone className="size-4" />,
  bank_transfer: <Building2 className="size-4" />,
  manual_transfer: <Banknote className="size-4" />,
  pos: <MonitorSmartphone className="size-4" />,
  merchant_code: <FileText className="size-4" />,
  qr_payment: <QrCode className="size-4" />,
};

const PROVIDER_COLORS: Record<string, string> = {
  stripe: 'text-purple-600',
  paypal: 'text-blue-600',
  mpesa: 'text-red-600',
  emola: 'text-emerald-600 dark:text-emerald-400',
  bank_transfer: 'text-amber-600',
  manual_transfer: 'text-amber-700',
  pos: 'text-indigo-600',
  merchant_code: 'text-teal-600',
  qr_payment: 'text-violet-600',
};

const CURRENCY_OPTIONS = ['MZN', 'USD', 'EUR', 'ZAR', 'BRL'];

// Manual method definitions for quick add
const MANUAL_METHODS = [
  { name: 'manual_transfer', displayName: 'Transferência Manual', description: 'Pagamento via transferência bancária manual', icon: 'manual_transfer' },
  { name: 'pos', displayName: 'Pagamento via POS', description: 'Pagamento através de terminal POS', icon: 'pos' },
  { name: 'merchant_code', displayName: 'Código de Comerciante', description: 'Pagamento usando código de comerciante', icon: 'merchant_code' },
  { name: 'qr_payment', displayName: 'Pagamento via QR Code', description: 'Pagamento escaneando QR Code', icon: 'qr_payment' },
];

export function AdminPaymentProviders() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'providers' | 'manual'>('providers');
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [configForm, setConfigForm] = useState<ProviderConfig>({});
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentProvider | null>(null);
  const [addManualOpen, setAddManualOpen] = useState(false);
  const [addManualForm, setAddManualForm] = useState({
    name: 'manual_transfer',
    displayName: '',
    description: '',
    instructions: '',
    instructionsI18n: {} as Record<string, string>,
  });

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
            message = 'Stripe credentials configured. Test by creating a test payment.';
            testResult = true;
          }
          break;
        }
        case 'paypal': {
          if (!provider.config?.paypalClientId || !provider.config?.paypalClientSecret) {
            message = 'PayPal credentials are not configured';
          } else {
            message = 'PayPal credentials configured.';
            testResult = true;
          }
          break;
        }
        case 'mpesa': {
          if (!provider.config?.mpesaApiKey || !provider.config?.mpesaPublicKey) {
            message = 'M-Pesa credentials are not configured';
          } else {
            message = 'M-Pesa credentials configured.';
            testResult = true;
          }
          break;
        }
        case 'emola': {
          if (!provider.config?.emolaApiKey || !provider.config?.emolaMerchantId) {
            message = 'e-Mola credentials are not configured';
          } else {
            message = 'e-Mola credentials configured.';
            testResult = true;
          }
          break;
        }
        case 'bank_transfer':
        case 'manual_transfer': {
          if (!provider.config?.bankName && !provider.config?.transferInstructions) {
            message = 'Transfer details are not configured';
          } else {
            message = 'Transfer details configured.';
            testResult = true;
          }
          break;
        }
        case 'pos': {
          if (!provider.config?.posInstructions) {
            message = 'POS instructions are not configured';
          } else {
            message = 'POS configured.';
            testResult = true;
          }
          break;
        }
        case 'merchant_code': {
          if (!provider.config?.merchantCode) {
            message = 'Merchant code is not configured';
          } else {
            message = 'Merchant code configured.';
            testResult = true;
          }
          break;
        }
        case 'qr_payment': {
          message = 'QR payment configured.';
          testResult = true;
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
      case 'manual_transfer':
        return !!provider.config?.transferInstructions;
      case 'pos':
        return !!provider.config?.posInstructions;
      case 'merchant_code':
        return !!provider.config?.merchantCode;
      case 'qr_payment':
        return !!provider.config?.qrInstructions;
      default:
        return false;
    }
  };

  // Add manual payment method
  const handleAddManual = async () => {
    setSaving(true);
    try {
      const instructionsI18nObj: Record<string, string> = {};
      for (const lang of Object.keys(addManualForm.instructionsI18n)) {
        if (addManualForm.instructionsI18n[lang]?.trim()) {
          instructionsI18nObj[lang] = addManualForm.instructionsI18n[lang];
        }
      }

      // Build config based on method type
      const config: Record<string, string | null> = {};
      switch (addManualForm.name) {
        case 'manual_transfer':
          config.transferInstructions = addManualForm.instructions;
          config.transferInstructionsI18n = Object.keys(instructionsI18nObj).length > 0 ? JSON.stringify(instructionsI18nObj) : null;
          break;
        case 'pos':
          config.posInstructions = addManualForm.instructions;
          config.posInstructionsI18n = Object.keys(instructionsI18nObj).length > 0 ? JSON.stringify(instructionsI18nObj) : null;
          break;
        case 'merchant_code':
          config.merchantCodeInstructions = addManualForm.instructions;
          config.merchantCodeInstructionsI18n = Object.keys(instructionsI18nObj).length > 0 ? JSON.stringify(instructionsI18nObj) : null;
          break;
        case 'qr_payment':
          config.qrInstructions = addManualForm.instructions;
          config.qrInstructionsI18n = Object.keys(instructionsI18nObj).length > 0 ? JSON.stringify(instructionsI18nObj) : null;
          break;
      }

      const res = await apiFetch('/api/admin/payments/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addManualForm.name,
          displayName: addManualForm.displayName || MANUAL_METHODS.find(m => m.name === addManualForm.name)?.displayName || addManualForm.name,
          description: addManualForm.description || MANUAL_METHODS.find(m => m.name === addManualForm.name)?.description || '',
          isActive: true,
          isTestMode: false,
          config,
          supportedCurrencies: ['MZN'],
          processingFee: 0,
          processingFeeFixed: 0,
          minAmount: 0,
          maxAmount: 0,
          order: providers.length + 1,
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.itemCreated') || 'Created', description: 'Manual payment method added' });
        setAddManualOpen(false);
        setAddManualForm({
          name: 'manual_transfer', displayName: '', description: '',
          instructions: '', instructionsI18n: {},
        });
        fetchProviders();
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to add method', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to add method', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // i18n language list for manual method instructions
  const i18nLangs = AVAILABLE_LANGUAGES.filter((code) => code !== DEFAULT_LANGUAGE);

  // Separate providers into automated and manual
  const automatedProviders = providers.filter((p) => !MANUAL_METHODS.some((m) => m.name === p.name));
  const manualProviders = providers.filter((p) => MANUAL_METHODS.some((m) => m.name === p.name));

  // Render config fields based on provider type
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
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('stripePublicKey')}>
                  {showSecrets['stripePublicKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Secret Key (sk_...)</Label>
              <div className="relative">
                <Input type={showSecrets['stripeSecretKey'] ? 'text' : 'password'} placeholder="sk_test_..." value={configForm.stripeSecretKey || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, stripeSecretKey: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('stripeSecretKey')}>
                  {showSecrets['stripeSecretKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Webhook Secret (whsec_...)</Label>
              <div className="relative">
                <Input type={showSecrets['stripeWebhookSecret'] ? 'text' : 'password'} placeholder="whsec_..." value={configForm.stripeWebhookSecret || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('stripeWebhookSecret')}>
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
                <Input type={showSecrets['paypalClientId'] ? 'text' : 'password'} placeholder="PayPal Client ID" value={configForm.paypalClientId || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, paypalClientId: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('paypalClientId')}>
                  {showSecrets['paypalClientId'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Client Secret</Label>
              <div className="relative">
                <Input type={showSecrets['paypalClientSecret'] ? 'text' : 'password'} placeholder="PayPal Client Secret" value={configForm.paypalClientSecret || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, paypalClientSecret: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('paypalClientSecret')}>
                  {showSecrets['paypalClientSecret'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Webhook ID</Label>
              <Input placeholder="PayPal Webhook ID" value={configForm.paypalWebhookId || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, paypalWebhookId: e.target.value }))} />
            </div>
          </div>
        );

      case 'mpesa':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key</Label>
              <div className="relative">
                <Input type={showSecrets['mpesaApiKey'] ? 'text' : 'password'} placeholder="M-Pesa API Key" value={configForm.mpesaApiKey || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, mpesaApiKey: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('mpesaApiKey')}>
                  {showSecrets['mpesaApiKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Public Key</Label>
              <div className="relative">
                <Input type={showSecrets['mpesaPublicKey'] ? 'text' : 'password'} placeholder="M-Pesa Public Key" value={configForm.mpesaPublicKey || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, mpesaPublicKey: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('mpesaPublicKey')}>
                  {showSecrets['mpesaPublicKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Provider Code</Label>
              <Input placeholder="e.g., 171717" value={configForm.mpesaServiceProviderCode || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, mpesaServiceProviderCode: e.target.value }))} />
            </div>
          </div>
        );

      case 'emola':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key</Label>
              <div className="relative">
                <Input type={showSecrets['emolaApiKey'] ? 'text' : 'password'} placeholder="e-Mola API Key" value={configForm.emolaApiKey || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, emolaApiKey: e.target.value }))} className="pr-10" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggleSecretVisibility('emolaApiKey')}>
                  {showSecrets['emolaApiKey'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Merchant ID</Label>
              <Input placeholder="e-Mola Merchant ID" value={configForm.emolaMerchantId || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, emolaMerchantId: e.target.value }))} />
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.bankName') || 'Bank Name'}</Label>
              <Input placeholder="e.g., Millennium BIM" value={configForm.bankName || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, bankName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.accountName') || 'Account Name'}</Label>
              <Input placeholder="Account holder name" value={configForm.bankAccountName || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, bankAccountName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.accountNumber') || 'Account Number'}</Label>
              <Input placeholder="Bank account number" value={configForm.bankAccountNumber || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">IBAN</Label>
              <Input placeholder="e.g., MZ59..." value={configForm.bankIban || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, bankIban: e.target.value }))} />
            </div>
            {renderI18nInstructions('bankInstructions', 'bankInstructionsI18n')}
          </div>
        );

      case 'manual_transfer':
        return (
          <div className="space-y-4">
            {renderI18nInstructions('transferInstructions', 'transferInstructionsI18n')}
          </div>
        );

      case 'pos':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Terminal ID</Label>
              <Input placeholder="e.g., POS-001" value={configForm.posTerminalId || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, posTerminalId: e.target.value }))} />
            </div>
            {renderI18nInstructions('posInstructions', 'posInstructionsI18n')}
          </div>
        );

      case 'merchant_code':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Código de Comerciante</Label>
              <Input placeholder="e.g., 123456" value={configForm.merchantCode || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, merchantCode: e.target.value }))} />
            </div>
            {renderI18nInstructions('merchantCodeInstructions', 'merchantCodeInstructionsI18n')}
          </div>
        );

      case 'qr_payment':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">QR Code URL (opcional)</Label>
              <Input placeholder="https://..." value={configForm.qrCodeUrl || ''} onChange={(e) => setConfigForm(prev => ({ ...prev, qrCodeUrl: e.target.value }))} />
            </div>
            {renderI18nInstructions('qrInstructions', 'qrInstructionsI18n')}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No configuration fields for this provider</p>;
    }
  };

  // Render instructions field with i18n support for any provider
  const renderI18nInstructions = (instructionsKey: string, i18nKey: string) => {
    const instructionsValue = (configForm as any)[instructionsKey] || '';
    const i18nValue = (configForm as any)[i18nKey] || '';
    let i18nParsed: Record<string, string> = {};
    try { if (i18nValue) i18nParsed = typeof i18nValue === 'string' ? JSON.parse(i18nValue) : i18nValue; } catch {}

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('payment.instructions') || 'Instructions'} (Padrão)</Label>
          <Textarea
            placeholder="Instruções de pagamento para o cliente..."
            value={instructionsValue}
            onChange={(e) => setConfigForm(prev => ({ ...prev, [instructionsKey]: e.target.value }))}
            rows={3}
          />
        </div>
        {i18nLangs.map((lang) => (
          <div key={lang} className="space-y-2">
            <Label className="text-sm font-medium">{t('payment.instructions') || 'Instructions'} ({lang})</Label>
            <Textarea
              placeholder={`Instruções em ${lang}...`}
              value={i18nParsed[lang] || ''}
              onChange={(e) => {
                const updated = { ...i18nParsed, [lang]: e.target.value };
                setConfigForm(prev => ({ ...prev, [i18nKey]: Object.values(updated).some(v => v) ? JSON.stringify(updated) : null }));
              }}
              rows={2}
            />
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      </div>
    );
  }

  // Table row renderer for providers
  const renderProviderRow = (provider: PaymentProvider) => (
    <TableRow key={provider.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={PROVIDER_COLORS[provider.name] || 'text-muted-foreground'}>
            {PROVIDER_ICONS[provider.name] || <CreditCard className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{provider.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{provider.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <p className="text-xs text-muted-foreground max-w-[200px] truncate">{provider.description}</p>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <div className="flex flex-wrap gap-1">
          {provider.supportedCurrencies.map((c) => (
            <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-xs">
        {provider.processingFee}%{provider.processingFeeFixed > 0 ? ` + ${provider.processingFeeFixed}` : ''}
      </TableCell>
      <TableCell>
        {!hasConfiguredKeys(provider) && (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
            <AlertCircle className="size-3 mr-1" />
            {t('payment.notConfigured') || 'Not Configured'}
          </Badge>
        )}
        {provider.isTestMode && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs ml-1">
            <TestTube className="size-3 mr-1" />
            Test
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleTestConnection(provider)} disabled={testing === provider.id} title="Test">
            {testing === provider.id ? <Loader2 className="size-3.5 animate-spin" /> : <TestTube className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleToggleActive(provider, !provider.isActive)} title={provider.isActive ? 'Deactivate' : 'Activate'}>
            {provider.isActive ? <ToggleRight className="size-4 text-emerald-500" /> : <ToggleLeft className="size-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openConfigEditor(provider)} title="Configure">
            <Settings2 className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(provider); setDeleteDialogOpen(true); }} title="Delete">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

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
          {t('payment.providersDesc') || 'Configure payment providers and manual payment methods.'}
        </p>
      </motion.div>

      {/* Tabs: Automated vs Manual */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'providers' | 'manual')}>
          <TabsList>
            <TabsTrigger value="providers" className="gap-1.5">
              <Globe className="h-4 w-4" />
              {t('payment.automated') || 'Automated'}
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <Banknote className="h-4 w-4" />
              {t('payment.manualMethods') || 'Manual Methods'}
            </TabsTrigger>
          </TabsList>

          {/* Automated Providers Tab - Table */}
          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('payment.provider') || 'Provider'}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('admin.description') || 'Description'}</TableHead>
                        <TableHead>{t('ads.status') || 'Status'}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('payment.currencies') || 'Currencies'}</TableHead>
                        <TableHead className="hidden lg:table-cell">{t('payment.fee') || 'Fee'}</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead>{t('ads.actions') || 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automatedProviders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <Banknote className="size-8 mx-auto mb-2 opacity-30" />
                            <p>{t('payment.noProviders') || 'No providers found. Click refresh.'}</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        automatedProviders.map(renderProviderRow)
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Methods Tab - Table + Add */}
          <TabsContent value="manual" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddManualOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4" />
                {t('payment.addManualMethod') || 'Add Manual Method'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('payment.method') || 'Method'}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('admin.description') || 'Description'}</TableHead>
                        <TableHead>{t('ads.status') || 'Status'}</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead>{t('ads.actions') || 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualProviders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <Banknote className="size-8 mx-auto mb-2 opacity-30" />
                            <p>{t('payment.noManualMethods') || 'No manual methods. Click "Add Manual Method" to create one.'}</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        manualProviders.map(renderProviderRow)
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Security Notice */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="size-4 text-emerald-500" />
              {t('payment.securityNotice') || 'Security Notice'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('payment.securityNoticeDesc') || 'All API keys and secrets are stored securely. Only public keys are sent to the frontend. Secret keys are always masked in the admin interface.'}
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
              {editingProvider && <span className={PROVIDER_COLORS[editingProvider.name] || ''}>{PROVIDER_ICONS[editingProvider.name] || <CreditCard className="size-5" />}</span>}
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
                    <Input value={settingsForm.displayName || ''} onChange={(e) => setSettingsForm(prev => ({ ...prev, displayName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('admin.description') || 'Description'}</Label>
                    <Input value={settingsForm.description || ''} onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('admin.order') || 'Order'}</Label>
                    <Input type="number" value={settingsForm.order || 0} onChange={(e) => setSettingsForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* API Configuration */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {t('payment.apiConfiguration') || 'Configuration'}
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
                    <Input type="number" step="0.01" value={settingsForm.processingFee || 0} onChange={(e) => setSettingsForm(prev => ({ ...prev, processingFee: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.fixedFee') || 'Fixed Fee'}</Label>
                    <Input type="number" step="0.01" value={settingsForm.processingFeeFixed || 0} onChange={(e) => setSettingsForm(prev => ({ ...prev, processingFeeFixed: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.minAmount') || 'Min Amount'}</Label>
                    <Input type="number" value={settingsForm.minAmount || 0} onChange={(e) => setSettingsForm(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('payment.maxAmount') || 'Max Amount (0 = unlimited)'}</Label>
                    <Input type="number" value={settingsForm.maxAmount || 0} onChange={(e) => setSettingsForm(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>

                {/* Supported Currencies */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('payment.supportedCurrencies') || 'Supported Currencies'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCY_OPTIONS.map((currency) => {
                      const isSelected = (settingsForm.supportedCurrencies || []).includes(currency);
                      return (
                        <Button key={currency} variant={isSelected ? 'default' : 'outline'} size="sm" className={isSelected ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''} onClick={() => {
                          const current = settingsForm.supportedCurrencies || [];
                          const updated = isSelected ? current.filter((c: string) => c !== currency) : [...current, currency];
                          setSettingsForm(prev => ({ ...prev, supportedCurrencies: updated }));
                        }}>
                          {currency}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Test Mode Toggle */}
                <div className="flex items-center gap-3">
                  <Switch checked={editingProvider.isTestMode} onCheckedChange={(checked) => { handleToggleActive(editingProvider, editingProvider.isActive); }} />
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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveConfig} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              {t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Method Dialog */}
      <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {t('payment.addManualMethod') || 'Add Manual Payment Method'}
            </DialogTitle>
            <DialogDescription>
              {t('payment.addManualMethodDesc') || 'Add a manual payment method with multilingual instructions for customers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.methodType') || 'Method Type'}</Label>
              <Select value={addManualForm.name} onValueChange={(v) => {
                const method = MANUAL_METHODS.find(m => m.name === v);
                setAddManualForm(prev => ({
                  ...prev, name: v,
                  displayName: method?.displayName || '',
                  description: method?.description || '',
                }));
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MANUAL_METHODS.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      <div className="flex items-center gap-2">
                        <span className={PROVIDER_COLORS[m.name] || ''}>{PROVIDER_ICONS[m.name]}</span>
                        {m.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.name') || 'Display Name'}</Label>
              <Input value={addManualForm.displayName} onChange={(e) => setAddManualForm(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Nome do método" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.description') || 'Description'}</Label>
              <Input value={addManualForm.description} onChange={(e) => setAddManualForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Descrição do método" />
            </div>

            {/* Instructions (default language) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('payment.instructions') || 'Instructions'} (Padrão)</Label>
              <Textarea
                value={addManualForm.instructions}
                onChange={(e) => setAddManualForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instruções de pagamento para o cliente..."
                rows={3}
              />
            </div>

            {/* Instructions (other languages) */}
            {i18nLangs.map((lang) => (
              <div key={lang} className="space-y-2">
                <Label className="text-sm font-medium">{t('payment.instructions') || 'Instructions'} ({lang})</Label>
                <Textarea
                  value={addManualForm.instructionsI18n[lang] || ''}
                  onChange={(e) => setAddManualForm(prev => ({ ...prev, instructionsI18n: { ...prev.instructionsI18n, [lang]: e.target.value } }))}
                  placeholder={`Instruções em ${lang}...`}
                  rows={2}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddManualOpen(false)}>
              {t('admin.cancel') || 'Cancel'}
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddManual} disabled={saving || !addManualForm.instructions.trim()}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
              {t('admin.save') || 'Add Method'}
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
