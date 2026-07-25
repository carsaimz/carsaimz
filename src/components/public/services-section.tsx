'use client';

import { useState, useEffect } from 'react';
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
import { useAppStore } from '@/lib/store';

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
  description: string | null;
  icon: string | null;
  basePrice: number | null;
  isFeatured: boolean;
  order: number;
}

const fallbackServices: ServiceData[] = [
  {
    id: '1',
    slug: 'web-development',
    title: 'Web Development',
    description: 'Modern and responsive websites and web applications built with Next.js, React, and TypeScript. Complete solutions for Mozambican businesses.',
    icon: 'Globe',
    basePrice: 15000,
    isFeatured: true,
    order: 1,
  },
  {
    id: '2',
    slug: 'mobile-apps',
    title: 'Mobile Apps',
    description: 'Native and hybrid mobile apps for Android and iOS. Integration with local APIs like M-Pesa and Mozambican government services.',
    icon: 'Smartphone',
    basePrice: 25000,
    isFeatured: true,
    order: 2,
  },
  {
    id: '3',
    slug: 'ui-ux-design',
    title: 'UI/UX Design',
    description: 'Intuitive interface design and user experience centered on the Mozambican context. Prototyping, usability testing, and complete design systems.',
    icon: 'Palette',
    basePrice: 8000,
    isFeatured: true,
    order: 3,
  },
  {
    id: '4',
    slug: 'cloud-solutions',
    title: 'Cloud Solutions',
    description: 'Cloud infrastructure and migration to AWS, Azure, and Google Cloud. Storage and computing solutions adapted for businesses in Maputo and beyond.',
    icon: 'Cloud',
    basePrice: 12000,
    isFeatured: false,
    order: 4,
  },
  {
    id: '5',
    slug: 'devops',
    title: 'DevOps',
    description: 'CI/CD pipeline automation, monitoring, and infrastructure management. Docker, Kubernetes, and Terraform for efficient operations in Mozambique.',
    icon: 'Server',
    basePrice: 10000,
    isFeatured: false,
    order: 5,
  },
  {
    id: '6',
    slug: 'ai-data-analytics',
    title: 'AI & Data Analytics',
    description: 'Artificial intelligence and data analysis for informed business decisions. Machine learning, analytics dashboards, and data processing tailored for the Mozambican market.',
    icon: 'Brain',
    basePrice: 20000,
    isFeatured: true,
    order: 6,
  },
];

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

export function ServicesSection() {
  const { t } = useLanguage();
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setServices(data.data);
        } else {
          setServices(fallbackServices);
        }
      })
      .catch(() => {
        setServices(fallbackServices);
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
    <section id="services" className="py-16 sm:py-24 bg-background">
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
          {services.map((service) => {
            const IconComponent = iconMap[service.icon || 'Globe'] || Globe;

            return (
              <motion.div key={service.id} variants={cardVariants}>
                <Card
                  className="group hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300 h-full"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">
                        {service.title}
                      </CardTitle>
                    </div>
                    {service.isFeatured && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                      >
                        Featured
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-0">
                    {service.basePrice && (
                      <span className="text-emerald-700 font-semibold">
                        {formatPrice(service.basePrice)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 group-hover:bg-emerald-100"
                      onClick={() => setCurrentView('services')}
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
      </div>
    </section>
  );
}
