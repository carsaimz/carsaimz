'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Star, MessageSquarePlus, Send, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { getGravatarUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function TestimonialsPage() {
  const { t, language, formatDate } = useLanguage();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formContent, setFormContent] = useState('');

  useEffect(() => {
    apiFetch('/api/testimonials')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data?.length > 0) {
          setTestimonials(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!formName.trim() || !formContent.trim()) {
      toast({
        title: t('common.error') || 'Error',
        description: t('testimonials.nameContentRequired') || 'Name and content are required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          company: formCompany.trim(),
          rating: formRating,
          content: formContent.trim(),
        }),
      });

      const data = await safeJson(res);
      if (data?.success) {
        toast({
          title: t('common.success') || 'Success',
          description: t('testimonials.submittedForReview') || 'Testimonial submitted for review',
        });
        setDialogOpen(false);
        // Reset form
        setFormName('');
        setFormEmail('');
        setFormCompany('');
        setFormRating(5);
        setFormContent('');
      } else {
        toast({
          title: t('common.error') || 'Error',
          description: data?.message || 'Failed to submit testimonial',
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
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 overflow-hidden">
        <Suspense fallback={null}>
          <FloatingOrbs count={3} opacity={0.04} />
        </Suspense>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {t('testimonials.pageTitle') || 'What Our Clients Say'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {t('testimonials.pageSubtitle') || 'Real stories from real clients who trust Carsai Mozambique'}
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <MessageSquarePlus className="h-4 w-4" />
                  {t('testimonials.submitTestimonial') || 'Submit Testimonial'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquarePlus className="h-5 w-5 text-emerald-600" />
                    {t('testimonials.submitTestimonial') || 'Submit Testimonial'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-name">{t('common.name') || 'Name'} *</Label>
                    <Input
                      id="testimonial-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t('common.enterName') || 'Enter your name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-email">{t('common.email') || 'Email'}</Label>
                    <Input
                      id="testimonial-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder={t('common.enterEmail') || 'Enter your email'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-company">{t('common.company') || 'Company'}</Label>
                    <Input
                      id="testimonial-company"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder={t('common.enterCompany') || 'Enter your company name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('testimonials.rating') || 'Rating'} *</Label>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormRating(i + 1)}
                          className="p-1 hover:scale-110 transition-transform"
                          aria-label={`Rate ${i + 1} stars`}
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              i < formRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-content">{t('testimonials.content') || 'Content'} *</Label>
                    <Textarea
                      id="testimonial-content"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder={t('testimonials.contentPlaceholder') || 'Share your experience...'}
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitting
                      ? (t('common.submitting') || 'Submitting...')
                      : (t('common.submit') || 'Submit')
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-emerald-200/50">
                  <CardContent className="p-6">
                    <Skeleton className="h-5 w-24 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquarePlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('testimonials.noTestimonials') || 'No testimonials yet'}</h3>
              <p className="text-muted-foreground">{t('testimonials.beFirst') || 'Be the first to share your experience!'}</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {testimonials.map((testimonial) => {
                const resolvedContent = resolveI18nContent(
                  testimonial.contentI18n,
                  testimonial.content,
                  language
                );

                return (
                  <motion.div key={testimonial.id} variants={cardVariants}>
                    <Card className="h-full border-emerald-200/50 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-emerald-50/20">
                      <CardContent className="p-6 flex flex-col h-full">
                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mb-3">
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
                        <p className="text-sm sm:text-base leading-relaxed text-foreground mb-4 flex-1 italic">
                          &ldquo;{resolvedContent}&rdquo;
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3 pt-3 border-t border-emerald-100">
                          <Avatar className="h-10 w-10 border-2 border-emerald-200">
                            {testimonial.avatar && testimonial.avatar.startsWith('data:') ? (
                              <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                            ) : (
                              <AvatarImage
                                src={getGravatarUrl(testimonial.name, 80)}
                                alt={testimonial.name}
                              />
                            )}
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-xs">
                              {testimonial.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                            {testimonial.company && (
                              <p className="text-xs text-muted-foreground truncate">{testimonial.company}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
