'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { getGravatarUrl } from '@/lib/utils';
import Link from 'next/link';

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

// Auto-play interval (ms)
const AUTO_PLAY_INTERVAL = 5000;

export function TestimonialsSection() {
  const { t, language } = useLanguage();
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Number of visible testimonials on desktop
  const visibleCount = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 3 : typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1;

  useEffect(() => {
    apiFetch('/api/testimonials')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data?.length > 0) {
          setTestimonials(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state, no fallback
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (isPaused || testimonials.length <= visibleCount) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, testimonials.length, visibleCount]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, [testimonials.length]);

  // Touch/swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Get the visible testimonials for the current index
  const getVisibleTestimonials = () => {
    if (testimonials.length === 0) return [];
    const items: TestimonialData[] = [];
    for (let i = 0; i < Math.min(visibleCount, testimonials.length); i++) {
      const idx = (currentIndex + i) % testimonials.length;
      items.push(testimonials[idx]);
    }
    return items;
  };

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

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section
      id="testimonials"
      className="relative py-16 sm:py-24 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40" />

      {/* Decorative background */}
      <Suspense fallback={null}>
        <FloatingOrbs count={2} opacity={0.06} />
      </Suspense>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
        <div
          className="max-w-6xl mx-auto relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visibleTestimonials.map((testimonial) => {
                const resolvedContent = resolveI18nContent(
                  testimonial.contentI18n,
                  testimonial.content,
                  language
                );

                return (
                  <Card
                    key={testimonial.id}
                    className="border-emerald-200/50 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="p-6">
                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < testimonial.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-sm sm:text-base leading-relaxed text-foreground mb-6 italic">
                        &ldquo;{resolvedContent}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-3 border-t border-emerald-100">
                        <Avatar className="h-11 w-11 border-2 border-emerald-200">
                          {testimonial.avatar && testimonial.avatar.startsWith('data:') ? (
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          ) : (
                            <AvatarImage
                              src={getGravatarUrl(testimonial.name, 96)}
                              alt={testimonial.name}
                            />
                          )}
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-sm">
                            {testimonial.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {testimonial.name}
                          </p>
                          {testimonial.company && (
                            <p className="text-xs text-muted-foreground">
                              {testimonial.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={prevSlide}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
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
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <Link href="/testimonials">
            <Button variant="outline" className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
              {t('testimonials.viewAll') || 'View All Testimonials'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
