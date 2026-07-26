'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, BarChart3, ToggleLeft, Globe, RefreshCw } from 'lucide-react';
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
  { icon: Cookie, key: 'whatAreCookies' },
  { icon: Settings, key: 'types' },
  { icon: BarChart3, key: 'howWeUse' },
  { icon: ToggleLeft, key: 'management' },
  { icon: Globe, key: 'thirdParty' },
  { icon: RefreshCw, key: 'updates' },
] as const;

export function CookiesPage() {
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
            <Cookie className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t('legal.cookies.pageTitle')}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('legal.cookies.pageSubtitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t('legal.cookies.lastUpdate')}</p>
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
                      <CardTitle className="text-xl">{t(`legal.cookies.sections.${section.key}.title`)}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{t(`legal.cookies.sections.${section.key}.content`)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <Separator className="my-8" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('legal.cookies.seeAlso')}{' '}
            <Link href="/privacy" className="text-emerald-600 hover:underline">{t('legal.cookies.seeAlsoPrivacy')}</Link>
            {' · '}
            <Link href="/terms" className="text-emerald-600 hover:underline">{t('legal.cookies.seeAlsoTerms')}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
