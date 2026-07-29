'use client';

import { motion } from 'framer-motion';
import {
  ShieldAlert,
  FileText,
  AlertOctagon,
  MessageSquare,
  UserX,
  Mail,
  Phone,
} from 'lucide-react';
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
  { icon: ShieldAlert, key: 'overview' },
  { icon: FileText, key: 'copyright' },
  { icon: AlertOctagon, key: 'notice' },
  { icon: MessageSquare, key: 'counterNotice' },
  { icon: UserX, key: 'repeatInfringers' },
  { icon: Mail, key: 'contact' },
] as const;

export function DmcaPage() {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex p-3 rounded-xl bg-red-100 text-red-700 mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('legal.dmca.pageTitle')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('legal.dmca.pageSubtitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('legal.dmca.lastUpdate')}
          </p>
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
                      <div className="p-2 rounded-lg bg-red-100 text-red-700">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl">
                        {t(`legal.dmca.sections.${section.key}.title`)}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {t(`legal.dmca.sections.${section.key}.content`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contact Info for DMCA Requests */}
        <div className="mt-8 p-4 rounded-xl bg-red-50/60 border border-red-200/80 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-red-600" />
            <Phone className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-sm text-foreground">
            Para notificações DMCA, contacte: carsaimozambique@gmail.com | M-Pesa: 847545020
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            WhatsApp:{' '}
            <a
              href="https://wa.me/258847545020"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              +258 84 754 5020
            </a>
          </p>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('legal.dmca.seeAlso')}{' '}
            <Link href="/terms" className="text-red-600 hover:underline">
              {t('legal.dmca.seeAlsoTerms')}
            </Link>
            {' · '}
            <Link href="/privacy" className="text-red-600 hover:underline">
              {t('legal.dmca.seeAlsoPrivacy')}
            </Link>
            {' · '}
            <Link href="/cookies" className="text-red-600 hover:underline">
              {t('legal.dmca.seeAlsoCookies')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
