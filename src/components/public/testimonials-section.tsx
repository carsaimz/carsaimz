'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { apiFetch } from '@/lib/api-fetch';

const FloatingOrbs = dynamic(
  () => import('@/components/common/3d-elements').then((mod) => mod.FloatingOrbs),
  { ssr: false }
);

interface TestimonialData {
  id: string;
  name: string;
  company: string | null;
  content: string;
  contentI18n: string | null;
  rating: number;
  avatar: string | null;
  isPublished: boolean;
}

// No fallback data - all data comes from the database via API

export function TestimonialsSection() {
  const { t, language } = useLanguage();
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    apiFetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setTestimonials(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state, no fallback
      })
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, [testimonials.length]);

  if (loading) {
    return (
      <section id="testimonials" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];
  const resolvedContent = resolveI18nContent(
    currentTestimonial.contentI18n,
    currentTestimonial.content,
    language
  );

  return (
    <section id="testimonials" className="relative py-16 sm:py-24 bg-background overflow-hidden">
      {/* Decorative background */}
      <Suspense fallback={null}>
        <FloatingOrbs count={2} opacity={0.06} />
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
            {t('home.testimonialTitle')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('home.testimonialSubtitle')}
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto relative">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-emerald-200 shadow-md bg-gradient-to-br from-white to-emerald-50/30">
              <CardContent className="p-6 sm:p-8">
                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < currentTestimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-base sm:text-lg leading-relaxed text-foreground mb-6 italic">
                  &ldquo;{resolvedContent}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-emerald-200">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                      {currentTestimonial.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {currentTestimonial.name}
                    </p>
                    {currentTestimonial.company && (
                      <p className="text-sm text-muted-foreground">
                        {currentTestimonial.company}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>

            {/* Dot indicators */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === currentIndex
                      ? 'w-8 bg-emerald-600'
                      : 'w-2.5 bg-emerald-200 hover:bg-emerald-400'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
