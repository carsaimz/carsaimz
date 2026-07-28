'use client';

import { motion } from 'framer-motion';
import { Scale, Briefcase, BookOpen, Shield, AlertTriangle, XCircle, Gavel, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const sectionKeys = [
  { icon: Scale, key: 'general' },
  { icon: Briefcase, key: 'services' },
  { icon: BookOpen, key: 'obligations' },
  { icon: Shield, key: 'intellectualProperty' },
  { icon: AlertTriangle, key: 'liability' },
  { icon: XCircle, key: 'termination' },
  { icon: Gavel, key: 'law' },
] as const;

export function TermsPage() {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex p-3 rounded-xl bg-emerald-100 text-emerald-700 mb-4">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t('legal.terms.pageTitle')}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('legal.terms.pageSubtitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t('legal.terms.lastUpdate')}</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {sectionKeys.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl">{t(`legal.terms.sections.${section.key}.title`)}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{t(`legal.terms.sections.${section.key}.content`)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contact Info for Legal Questions */}
        <div className="mt-8 p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm text-foreground">
            Para questões legais, contacte-nos: carsaimozambique@gmail.com | M-Pesa: 847545020
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            WhatsApp: <a href="https://wa.me/258847545020" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">+258 84 754 5020</a>
          </p>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('legal.terms.seeAlso')}{' '}
            <Link href="/privacy" className="text-emerald-600 hover:underline">{t('legal.terms.seeAlsoPrivacy')}</Link>
            {' · '}
            <Link href="/cookies" className="text-emerald-600 hover:underline">{t('legal.terms.seeAlsoCookies')}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
