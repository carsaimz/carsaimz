'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  MapPin,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useToast } from '@/hooks/use-toast';


const TechPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.TechPatternSVG),
  { ssr: false }
);

export function ContactSection() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await safeJson(res);

      if (data?.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        toast({
          title: t('contact.sentSuccess') || 'Mensagem enviada',
          description: t('contact.sentSuccessDesc') || 'Entraremos em contacto em breve.',
        });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        const msg = data?.message || 'Failed to send message';
        setError(msg);
        toast({ title: t('common.error') || 'Erro', description: msg, variant: 'destructive' });
      }
    } catch {
      const msg = t('common.networkError') || 'Network error';
      setError(msg);
      toast({ title: t('common.error') || 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
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
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                      <Send className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {t('contact.sentSuccess')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('common.success')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('contact.name')}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t('auth.fullName')}
                        className="focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contact.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t('contact.emailPlaceholder')}
                        className="focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.subject')}</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder={t('contact.subject')}
                        className="focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('contact.message')}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder={t('contact.messagePlaceholder')}
                        className="focus-visible:ring-emerald-500 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          {t('common.loading')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          {t('contact.send')}
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('contact.office')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.address')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t('contact.addressValue')}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium mt-1">
                      {t('contact.onlineNote')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.phone')}</p>
                    <p className="text-muted-foreground text-sm">
                      847545020 / 874512581 / 84246463 / 835020143
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.email')}</p>
                    <p className="text-muted-foreground text-sm">
                      <a href="mailto:carsaimozambique@gmail.com" className="hover:text-emerald-600 dark:text-emerald-400 transition-colors">carsaimozambique@gmail.com</a>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      <a href="mailto:suporte.carsaimz@gmail.com" className="hover:text-emerald-600 dark:text-emerald-400 transition-colors">suporte.carsaimz@gmail.com</a>
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


          </motion.div>
        </div>
      </div>
    </section>
  );
}
