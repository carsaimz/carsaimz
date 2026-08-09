'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Globe,
  Smartphone,
  Palette,
  Cloud,
  Server,
  Brain,
  ShoppingCart,
  BarChart3,
  Shield,
  Database,
  Cpu,
  Camera,
  Search,
  Code2,
  Layout,
  Headphones,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RichTextRenderer } from '@/components/common/rich-text-editor';
import { ServiceReviews } from '@/components/public/service-reviews';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { apiFetch, safeJson } from '@/lib/api-fetch';

const iconMap: Record<string, React.ElementType> = {
  Globe, Smartphone, Palette, Cloud, Server, Brain,
  ShoppingCart, BarChart3, Shield, Database, Cpu,
  Camera, Search, Code2, Layout, Headphones,
};

interface ServiceData {
  id: string;
  slug: string;
  title: string;
  titleI18n?: string | null;
  description?: string | null;
  descriptionI18n?: string | null;
  icon: string | null;
  basePrice?: number | null;
  price?: number | string | null;      // Legacy field from old client-seed
  isFeatured?: boolean;
  featured?: boolean;                  // Legacy field from old client-seed
  name?: string;                       // Legacy field from old client-seed
  isPublished?: boolean;
  order: number;
  createdAt?: string;
  images?: string | null;
}

/**
 * Extract the first image from the images field.
 */
function getCoverImage(images: string | null | undefined): string | null {
  if (!images) return null;
  if (images.startsWith('data:')) return images;
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Not JSON, return as-is
  }
  return null;
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ServiceDetail() {
  const { t, language, formatDate } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(() => !!slug && slug !== '__dynamic__');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || slug === '__dynamic__') {
      return;
    }

    apiFetch(`/api/services`)
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data) {
          const found = data.data.find((s: ServiceData) => s.slug === slug);
          if (found) {
            setService(found);
          } else {
            setError(t('common.notFound') || 'Service not found');
          }
        } else {
          setError('Failed to load service');
        }
      })
      .catch(() => {
        setError('Network error');
      })
      .finally(() => setLoading(false));
  }, [slug, t]);

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `MT ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error || t('common.notFound') || 'Service not found'}
          </h2>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/services')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('services.title') || 'Back to Services'}
          </Button>
        </motion.div>
      </div>
    );
  }

  const IconComponent = iconMap[service.icon || 'Globe'] || Globe;
  // Support legacy field names: name → title, featured → isFeatured
  const displayTitle = service.title || service.name || 'Serviço';
  const displayPrice = service.basePrice || (typeof service.price === 'number' ? service.price : null);
  const isFeaturedService = service.isFeatured || service.featured;
  const resolvedTitle = resolveI18nContent(service.titleI18n || null, displayTitle, language);
  const resolvedDescription = resolveI18nContent(service.descriptionI18n || null, service.description || '', language);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Back button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/services')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('services.title') || 'Services'}
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          {/* Cover Image */}
          {getCoverImage(service.images) && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={getCoverImage(service.images)!}
                alt={resolvedTitle}
                className="w-full h-48 md:h-64 object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              <IconComponent className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {resolvedTitle}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {isFeaturedService && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {displayPrice && (
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
                    {formatPrice(displayPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <Separator className="mb-8" />

        {/* Description / Content */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('admin.description') || 'Description'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resolvedDescription && resolvedDescription.includes('<') ? (
                <RichTextRenderer content={resolvedDescription} />
              ) : (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {resolvedDescription || t('common.noDescription') || 'No description available.'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features / CTA */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-foreground">
                  {t('services.interested') || 'Interested in this service?'}
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                {t('services.contactUs') || 'Contact us for a personalized quote and let us help you achieve your goals.'}
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push(`/quote?service=${service.slug}`)}
              >
                {t('common.requestQuote') || 'Request Quote'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Reviews / Ratings */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <ServiceReviews serviceId={service.id} serviceName={resolvedTitle} />
        </motion.div>
      </div>
    </div>
  );
}
