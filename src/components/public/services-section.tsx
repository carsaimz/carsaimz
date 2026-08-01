'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Smartphone,
  Palette,
  Cloud,
  Server,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { useRouter } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { stripHtml } from '@/lib/utils';

const TechPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.TechPatternSVG),
  { ssr: false }
);

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
  Palette,
  Cloud,
  Server,
  Brain,
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
  price?: number | string | null;   // Legacy field from old client-seed
  isFeatured?: boolean;
  featured?: boolean;               // Legacy field from old client-seed
  name?: string;                    // Legacy field from old client-seed
  order: number;
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

// No fallback data - all data comes from the database via API

/**
 * Render description as plain text in listing cards.
 * Strips HTML tags/entities to avoid showing raw HTML,
 * and uses overflow-wrap: break-word for proper wrapping
 * without breaking words in the middle.
 */
function renderDescription(content: string) {
  if (!content) return null;
  const plainText = stripHtml(content);
  if (!plainText) return null;
  return (
    <p className="text-muted-foreground text-sm leading-relaxed [overflow-wrap:break-word]">
      {plainText}
    </p>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface ServicesSectionProps {
  maxItems?: number;
  showViewAll?: boolean;
}

export function ServicesSection({ maxItems, showViewAll }: ServicesSectionProps = {}) {
  const { t, language } = useLanguage();
  useDocumentTitle('nav.services', 'Serviços');
  const router = useRouter();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/services')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data?.length > 0) {
          setServices(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state, no fallback
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `MT ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <section id="services" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="relative py-16 sm:py-24 bg-background overflow-hidden">
      {/* Decorative background */}
      <Suspense fallback={null}>
        <TechPatternSVG className="top-0 right-0 w-[300px] h-[300px]" opacity={0.04} />
      </Suspense>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('services.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.length === 0 && !loading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('common.noResults')}
            </div>
          ) : null}
          {(maxItems ? services.slice(0, maxItems) : services).map((service) => {
            const IconComponent = iconMap[service.icon || 'Globe'] || Globe;
            // Support legacy field names: name → title, featured → isFeatured
            const displayTitle = service.title || service.name || 'Serviço';
            const displayPrice = service.basePrice || (typeof service.price === 'number' ? service.price : null);
            const isFeaturedService = service.isFeatured || service.featured;
            const resolvedTitle = resolveI18nContent(service.titleI18n || null, displayTitle, language);
            const resolvedDescription = resolveI18nContent(service.descriptionI18n || null, service.description || '', language);

            return (
              <motion.div key={service.id} variants={cardVariants}>
                <Card
                  className="group hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300 h-full cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/services/${service.slug}`)}
                >
                  {/* Cover Image */}
                  {getCoverImage(service.images) && (
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={getCoverImage(service.images)!}
                        alt={resolvedTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">
                        {resolvedTitle}
                      </CardTitle>
                    </div>
                    {isFeaturedService && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                      >
                        Featured
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    {renderDescription(resolvedDescription)}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-0">
                    {displayPrice && (
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                        {formatPrice(displayPrice)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/services/${service.slug}`);
                      }}
                    >
                      {t('common.more')}
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Button */}
        {showViewAll && maxItems && services.length > maxItems && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button
              variant="outline"
              className="gap-2 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300"
              onClick={() => router.push('/services')}
            >
              {t('common.viewMore') || 'Ver Mais'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
