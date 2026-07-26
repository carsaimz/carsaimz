'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
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

export function ContactSection() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });

    // Reset submitted state after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-background">
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
                    <div className="inline-flex p-4 rounded-full bg-emerald-100 mb-4">
                      <Send className="h-8 w-8 text-emerald-600" />
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
                        placeholder="exemplo@email.com"
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
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  {t('contact.office')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.address')}</p>
                    <p className="text-muted-foreground text-sm">
                      Av. 24 de Julho, 1234
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Maputo, Moçambique
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.phone')}</p>
                    <p className="text-muted-foreground text-sm">
                      +258 84 123 4567
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.email')}</p>
                    <p className="text-muted-foreground text-sm">
                      info@carsai.mz
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
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
                  className="h-full bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 flex items-center justify-center relative"
                >
                  {/* Map visual elements */}
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
                    <MapPin className="h-8 w-8 text-emerald-600 mb-2" />
                    <p className="font-semibold text-emerald-800">
                      Maputo, Moçambique
                    </p>
                    <p className="text-sm text-emerald-600">
                      Av. 24 de Julho, 1234
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
