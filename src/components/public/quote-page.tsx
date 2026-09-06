'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe,
  Smartphone,
  Palette,
  Cloud,
  Server,
  Brain,
  ShoppingCart,
  Upload,
  AlertCircle,
  Info,
  Clock,
  Zap,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { useLanguage } from '@/contexts/language-context';
import { useAuthStore } from '@/lib/store';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { resolveI18nContent } from '@/lib/i18n-content';
import { PaymentCheckout } from '@/components/common/payment-checkout';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/use-document-title';

// ─── Icon Map (same as services-section) ─────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
  Palette,
  Cloud,
  Server,
  Brain,
};

// ─── Service Data Interface ──────────────────────────────────────────────────

interface ServiceData {
  id: string;
  slug: string;
  title: string;
  titleI18n?: string | null;
  description?: string | null;
  descriptionI18n?: string | null;
  icon: string | null;
  basePrice?: number | null;
  price?: number | string | null;
  isFeatured?: boolean;
  featured?: boolean;
  name?: string;
  order: number;
  images?: string | null;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

type QuoteStep = 1 | 2 | 3;

const stepConfig = [
  { number: 1, icon: ShoppingCart },
  { number: 2, icon: FileText },
  { number: 3, icon: CheckCircle2 },
] as const;

// ─── Animation Variants ──────────────────────────────────────────────────────

const pageVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function QuotePage() {
  const { t, language, formatCurrency } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { toast } = useToast();
  useDocumentTitle('quote.title', 'Solicitar Orçamento');

  // ── State ──
  const [step, setStep] = useState<QuoteStep>(1);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);

  // Step 2 form
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [additionalFeatures, setAdditionalFeatures] = useState('');

  // Step 3
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [quoteCreated, setQuoteCreated] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch Services ──
  useEffect(() => {
    apiFetch('/api/services')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data?.length > 0) {
          setServices(data.data);
          // Pre-select from URL param
          const serviceSlug = searchParams.get('service');
          if (serviceSlug) {
            const preSelected = data.data.find(
              (s: ServiceData) => s.slug === serviceSlug
            );
            if (preSelected) {
              setSelectedService(preSelected);
              setStep(2);
            }
          }
        }
      })
      .catch(() => {
        // Silently handle
      })
      .finally(() => setServicesLoading(false));
  }, [searchParams]);

  // ── Helpers ──
  const getDisplayTitle = useCallback(
    (service: ServiceData) => {
      const displayTitle = service.title || service.name || 'Serviço';
      return resolveI18nContent(
        service.titleI18n || null,
        displayTitle,
        language
      );
    },
    [language]
  );

  const getDisplayPrice = useCallback((service: ServiceData) => {
    return (
      service.basePrice ||
      (typeof service.price === 'number' ? service.price : null)
    );
  }, []);

  const formatPrice = useCallback(
    (price: number | null) => {
      if (!price) return null;
      return formatCurrency(price);
    },
    [formatCurrency]
  );

  // ── Handle Payment Success ──
  const handlePaymentSuccess = useCallback(
    async (data: any) => {
      const providerName = data?.type || data?.providerData?.type || null;
      const isManual =
        providerName === 'bank_transfer' ||
        providerName === 'mpesa' ||
        providerName === 'emola';

      setPaymentMethod(isManual ? providerName : 'auto');
      setPaymentId(data?.paymentId || null);
      setPaymentSuccess(true);

      // Create quote
      if (!quoteCreated && selectedService && user) {
        setCreatingQuote(true);
        try {
          const res = await apiFetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              title: `${getDisplayTitle(selectedService)} — ${urgency}`,
              description: description,
              serviceType: selectedService.slug,
              budget: budget ? Number(budget) : getDisplayPrice(selectedService) || 0,
            }),
          });
          const result = await safeJson(res);
          if (result && result.success) {
            setQuoteCreated(true);
            toast({
              title: t('quote.paymentSuccess') || 'Order submitted successfully!',
              description:
                t('quote.paymentSuccessDesc') ||
                'Your order has been registered.',
            });
          } else {
            toast({
              title: t('common.error') || 'Error',
              description:
                result?.error || 'Failed to create quote. Please contact support.',
              variant: 'destructive',
            });
          }
        } catch {
          toast({
            title: t('common.error') || 'Error',
            description: t('common.networkError') || 'Network error',
            variant: 'destructive',
          });
        } finally {
          setCreatingQuote(false);
        }
      }
    },
    [
      selectedService,
      user,
      quoteCreated,
      description,
      urgency,
      budget,
      getDisplayTitle,
      getDisplayPrice,
      toast,
      t,
    ]
  );

  // ── Handle Proof Upload ──
  const handleProofFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('common.error') || 'Error',
          description: 'Only image files are accepted',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('common.error') || 'Error',
          description: 'File must be under 5MB',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProofBase64(result);
        setProofPreview(result);
      };
      reader.readAsDataURL(file);
    },
    [toast, t]
  );

  const handleProofDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleProofFile(file);
    },
    [handleProofFile]
  );

  const handleProofInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleProofFile(file);
    },
    [handleProofFile]
  );

  const submitProof = useCallback(async () => {
    if (!proofBase64 || !paymentId) return;
    setProofUploading(true);
    try {
      const res = await apiFetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          metadata: { proofBase64 },
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        setProofUploaded(true);
        toast({
          title: t('common.success') || 'Success',
          description: 'Proof of payment uploaded successfully',
        });
      } else {
        toast({
          title: t('common.error') || 'Error',
          description: data?.error || 'Failed to upload proof',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('common.error') || 'Error',
        description: t('common.networkError') || 'Network error',
        variant: 'destructive',
      });
    } finally {
      setProofUploading(false);
    }
  }, [proofBase64, paymentId, toast, t]);

  // ── Urgency label helper ──
  const urgencyLabel = useCallback(
    (value: string) => {
      switch (value) {
        case 'normal':
          return t('quote.urgencyNormal') || 'Normal (2-4 weeks)';
        case 'urgent':
          return t('quote.urgencyUrgent') || 'Urgent (1-2 weeks)';
        case 'express':
          return t('quote.urgencyExpress') || 'Express (3-7 days)';
        default:
          return value;
      }
    },
    [t]
  );

  // ── Render: Step Indicator ──
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {stepConfig.map(({ number, icon: StepIcon }, idx) => {
        const isActive = step === number;
        const isCompleted = step > number;
        return (
          <div key={number} className="flex items-center gap-2 sm:gap-4">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <StepIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{number}</span>
            </motion.div>
            {idx < stepConfig.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-12 rounded-full transition-colors duration-200 ${
                  step > number
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Render: Step 1 – Select Service ──
  const renderStep1 = () => {
    if (servicesLoading) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        key="step1"
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('quote.selectService') || 'Select Service'}
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {t('quote.selectServiceDesc') ||
              'Choose the service you want to hire'}
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.noResults') || 'No results found'}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service) => {
              const IconComponent =
                iconMap[service.icon || 'Globe'] || Globe;
              const resolvedTitle = getDisplayTitle(service);
              const price = getDisplayPrice(service);
              const isSelected = selectedService?.id === service.id;

              return (
                <motion.div key={service.id} variants={cardVariants}>
                  <Card
                    className={`group cursor-pointer transition-all duration-300 h-full overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'hover:shadow-lg hover:border-emerald-500/50'
                    }`}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-lg transition-colors duration-300 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white'
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {resolvedTitle}
                          </CardTitle>
                        </div>
                        {isSelected && (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            ✓
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="flex items-center justify-between">
                        {price && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
                            {formatPrice(price)}
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // ── Render: Step 2 – Specify Requirements ──
  const renderStep2 = () => {
    const servicePrice = selectedService
      ? getDisplayPrice(selectedService)
      : null;

    return (
      <motion.div
        key="step2"
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('quote.specifications') || 'Specifications'}
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {t('quote.specificationsDesc') ||
              'Describe in detail what you need.'}
          </p>
        </div>

        {/* Selected Service Badge */}
        {selectedService && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge
              variant="secondary"
              className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm"
            >
              {getDisplayTitle(selectedService)}
            </Badge>
          </div>
        )}

        <Card className="border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-6 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('quote.descriptionLabel') || 'Order description'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder={
                  t('quote.descriptionPlaceholder') ||
                  'Describe your project...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none focus-visible:ring-emerald-500"
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm font-medium">
                {t('quote.budgetLabel') || 'Estimated budget (MT)'}{' '}
                <span className="text-muted-foreground text-xs">
                  ({t('common.optional') || 'optional'})
                </span>
              </Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder={
                  t('quote.budgetPlaceholder') || 'e.g. 15000'
                }
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="focus-visible:ring-emerald-500"
              />
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('quote.urgencyLabel') || 'Urgency'}
              </Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      {t('quote.urgencyNormal') || 'Normal (2-4 weeks)'}
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      {t('quote.urgencyUrgent') || 'Urgent (1-2 weeks)'}
                    </span>
                  </SelectItem>
                  <SelectItem value="express">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      {t('quote.urgencyExpress') || 'Express (3-7 days)'}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Features */}
            <div className="space-y-2">
              <Label
                htmlFor="additionalFeatures"
                className="text-sm font-medium"
              >
                {t('quote.additionalFeatures') || 'Additional features'}{' '}
                <span className="text-muted-foreground text-xs">
                  ({t('common.optional') || 'optional'})
                </span>
              </Label>
              <Textarea
                id="additionalFeatures"
                placeholder={
                  t('quote.additionalFeaturesPlaceholder') ||
                  'e.g. login system, admin panel...'
                }
                value={additionalFeatures}
                onChange={(e) => setAdditionalFeatures(e.target.value)}
                rows={3}
                className="resize-none focus-visible:ring-emerald-500"
              />
            </div>

            <Separator />

            {/* Price Notice — only shown if a base price exists */}
            {servicePrice && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('quote.priceNotice') ||
                    'The final price will depend on the complexity and additional features requested. The value below is only a base reference.'}
                </p>
              </div>
            )}

            {/* No Base Price Notice — shown when service has no published price */}
            {!servicePrice && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('quote.noBasePriceNotice') ||
                    'This service does not have a published base price. Please describe your requirements and our team will provide a custom quote.'}
                </p>
              </div>
            )}

            {/* Base Price */}
            {servicePrice && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {t('quote.basePrice') || 'Base price'}
                </span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatPrice(servicePrice)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('quote.backToServices') || 'Back to services'}
          </Button>
          <Button
            onClick={() => setStep(3)}
            disabled={!description.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[180px]"
          >
            {t('quote.proceedToPayment') || 'Proceed to Payment'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // ── Render: Step 3 – Checkout / Payment ──
  const renderStep3 = () => {
    const servicePrice = selectedService
      ? getDisplayPrice(selectedService)
      : null;

    // Show success state
    if (paymentSuccess && quoteCreated) {
      return (
        <motion.div
          key="step3-success"
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <CheckCircle2 className="h-20 w-20 mx-auto text-emerald-500" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {t('quote.paymentSuccess') ||
                    'Order submitted successfully!'}
                </h2>
                <p className="text-muted-foreground">
                  {t('quote.paymentSuccessDesc') ||
                    'Your order has been registered. You will receive a detailed proposal with the final price.'}
                </p>
              </div>

              {/* Manual payment note + proof upload */}
              {paymentMethod &&
                paymentMethod !== 'auto' &&
                !proofUploaded && (
                  <div className="space-y-4 text-left">
                    <Separator />
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {t('quote.manualPaymentNote') ||
                          'Manual payments require administrator confirmation after proof submission.'}
                      </p>
                    </div>

                    {/* Proof Upload Area */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {t('quote.proofUpload') || 'Upload proof'}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('quote.proofUploadDesc') ||
                          'For manual payments, upload your payment proof.'}
                      </p>

                      {!proofBase64 ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={handleProofDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-muted-foreground/30 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/30"
                        >
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-sm text-muted-foreground">
                            {t('quote.proofDragDrop') ||
                              'Drag image here or click to select'}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {t('quote.proofFormat') ||
                              'Formats: PNG, JPG, JPEG (max 5MB)'}
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleProofInputChange}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-800">
                            <img
                              src={proofPreview!}
                              alt="Proof of payment preview"
                              className="w-full max-h-64 object-contain bg-muted/30"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={submitProof}
                              disabled={proofUploading}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                              {proofUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              {proofUploading
                                ? t('common.loading') || 'Uploading...'
                                : t('common.confirm') || 'Submit Proof'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setProofBase64(null);
                                setProofPreview(null);
                              }}
                              disabled={proofUploading}
                            >
                              {t('common.cancel') || 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {proofUploaded && (
                <div className="flex items-center gap-2 justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Proof of payment submitted
                  </span>
                </div>
              )}

              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="mt-4"
              >
                {t('auth.backToHome') || 'Back to home'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="step3"
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('quote.checkout') || 'Complete Order'}
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {t('quote.checkoutDesc') ||
              'Complete payment to confirm your order'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Left: Order Summary */}
          <div>
            <Card className="border-emerald-200/50 dark:border-emerald-800/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('quote.orderSummary') || 'Order summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t('quote.serviceLabel') || 'Service'}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedService && (
                      <>
                        {(() => {
                          const Icon =
                            iconMap[selectedService.icon || 'Globe'] || Globe;
                          return (
                            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          );
                        })()}
                        <span className="font-medium">
                          {selectedService
                            ? getDisplayTitle(selectedService)
                            : '—'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t('quote.descriptionSummary') || 'Description'}
                  </span>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {description || '—'}
                  </p>
                </div>

                <Separator />

                {/* Urgency */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t('quote.urgencySummary') || 'Urgency'}
                  </span>
                  <div className="flex items-center gap-2">
                    {urgency === 'express' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : urgency === 'urgent' ? (
                      <Zap className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="text-sm font-medium">
                      {urgencyLabel(urgency)}
                    </span>
                  </div>
                </div>

                {/* Additional Features */}
                {additionalFeatures.trim() && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {t('quote.featuresSummary') || 'Extra features'}
                      </span>
                      <p className="text-sm bg-muted/50 rounded-lg p-3 max-h-24 overflow-y-auto">
                        {additionalFeatures}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t('quote.basePrice') || 'Base price'}
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {servicePrice
                      ? formatPrice(servicePrice)
                      : t('quote.finalPriceTBD') ||
                        'Final price to be confirmed'}
                  </span>
                </div>

                {budget && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('quote.estimatedPrice') || 'Estimated price'}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(Number(budget))}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Payment */}
          <div>
            {creatingQuote && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="ml-2 text-muted-foreground">
                  {t('common.loading') || 'Loading...'}
                </span>
              </div>
            )}
            {!creatingQuote && selectedService && servicePrice && (
              <PaymentCheckout
                amount={servicePrice}
                currency="MZN"
                description={getDisplayTitle(selectedService)}
                userId={user?.id}
                onSuccess={handlePaymentSuccess}
                onError={(err) => {
                  toast({
                    title: t('common.error') || 'Error',
                    description: err,
                    variant: 'destructive',
                  });
                }}
              />
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex items-center justify-start mt-6 max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setStep(2)}
            className="gap-2"
            disabled={paymentSuccess}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back') || 'Back'}
          </Button>
        </div>
      </motion.div>
    );
  };

  // ── Main Render ──
  return (
    <section className="relative py-12 sm:py-20 bg-background min-h-screen overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {t('quote.title') || 'Request a Quote'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('quote.subtitle') || 'Specify your request and proceed to payment'}
          </p>
        </motion.div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </div>
    </section>
  );
}
