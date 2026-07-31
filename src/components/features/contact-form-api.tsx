'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useDocumentTitle } from '@/hooks/use-document-title';

const TechPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.TechPatternSVG),
  { ssr: false }
);

// ──────────────────────────────────────────────
// Contact Form with API Integration
// ──────────────────────────────────────────────

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function ContactFormApi() {
  const { t } = useLanguage();
  useDocumentTitle('nav.contact', 'Contacto');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [state, setState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');

  // ── Validate form ──
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('contactForm.nameRequired');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('contactForm.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('contactForm.emailInvalid');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('contactForm.subjectRequired');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('contactForm.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('contactForm.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handle submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setState('loading');
    setApiError('');

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await safeJson(response);
      if (!data) { setApiError('Server returned non-JSON response'); setState('error'); return; }

      if (data.success) {
        setState('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        // Server returned validation errors
        if (data.errors) {
          setErrors(data.errors);
        }
        setApiError(data.error || t('contactForm.submitError'));
        setState('error');
      }
    } catch {
      setApiError(t('contactForm.submitError'));
      setState('error');
    }
  };

  // ── Handle field change ──
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error for this field on change
    if (errors[id as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  return (
    <section id="contact" className="relative py-16 sm:py-24 bg-background overflow-hidden">
      {/* Decorative background */}
      <Suspense fallback={null}>
        <TechPatternSVG className="bottom-[5%] right-[2%] w-[250px] h-[250px]" opacity={0.03} />
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
            {t('contact.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl">
                  {t('contact.send')} {t('contact.message')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {state === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center py-8"
                    >
                      <div className="inline-flex p-4 rounded-full bg-emerald-100 dark:bg-emerald-900 mb-4">
                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {t('contact.sentSuccess')}
                      </h3>
                      <p className="text-muted-foreground">
                        {t('contactForm.submitSuccess')}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        onClick={() => setState('idle')}
                      >
                        {t('common.send')} {t('common.more')}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('contact.name')}</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder={t('auth.fullName')}
                            className={`focus-visible:ring-emerald-500 ${
                              errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                          />
                          {errors.name && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              {errors.name}
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('contact.email')}</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="exemplo@email.com"
                            className={`focus-visible:ring-emerald-500 ${
                              errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                          />
                          {errors.email && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                          <Label htmlFor="subject">{t('contact.subject')}</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            placeholder={t('contact.subject')}
                            className={`focus-visible:ring-emerald-500 ${
                              errors.subject ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                          />
                          {errors.subject && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              {errors.subject}
                            </p>
                          )}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                          <Label htmlFor="message">{t('contact.message')}</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={5}
                            placeholder={t('contact.messagePlaceholder')}
                            className={`focus-visible:ring-emerald-500 resize-none ${
                              errors.message ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                          />
                          {errors.message && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              {errors.message}
                            </p>
                          )}
                        </div>

                        {/* API Error */}
                        {apiError && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg flex items-center gap-2"
                          >
                            <AlertCircle className="size-4" />
                            {apiError}
                          </motion.div>
                        )}

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={state === 'loading'}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {state === 'loading' ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('contactForm.submitting')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Send className="h-4 w-4" />
                              {t('contact.send')}
                            </span>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Office Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Office Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('contact.office')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.address')}</p>
                    <p className="text-muted-foreground text-sm">
                      Montepuez, Cabo Delgado
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Mozambique
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.phone')}</p>
                    <p className="text-muted-foreground text-sm">
                      847545020 / 874512581
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.email')}</p>
                    <p className="text-muted-foreground text-sm">
                      carsaimozambique@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.officeHours')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t('contact.weekdays')}: 8:00 - 18:00
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('contact.saturday')}: 9:00 - 13:00
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('contact.closed')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="h-48 overflow-hidden">
              <CardContent className="p-0 h-full relative">
                <div
                  className="h-full bg-gradient-to-br from-emerald-200 dark:from-emerald-800 via-emerald-100 dark:via-emerald-900 to-teal-200 dark:to-teal-800 flex items-center justify-center relative"
                >
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <path
                        d="M0,100 Q100,50 200,100 T400,100"
                        fill="none"
                        stroke="emerald"
                        strokeWidth="2"
                      />
                      <circle cx="200" cy="100" r="8" fill="#059669" />
                      <circle cx="100" cy="80" r="3" fill="#059669" />
                      <circle cx="300" cy="120" r="3" fill="#059669" />
                    </svg>
                  </div>
                  <div className="text-center z-10">
                    <MapPin className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <p className="font-semibold text-emerald-800">
                      Montepuez, Cabo Delgado, Mozambique
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Operação Online
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
