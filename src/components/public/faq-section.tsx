'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/language-context';

interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
  category: string;
}

const faqItems: FaqItem[] = [
  {
    id: 'faq-1',
    questionKey: 'faq.faq1Q',
    answerKey: 'faq.faq1A',
    category: 'services',
  },
  {
    id: 'faq-2',
    questionKey: 'faq.faq2Q',
    answerKey: 'faq.faq2A',
    category: 'payment',
  },
  {
    id: 'faq-3',
    questionKey: 'faq.faq3Q',
    answerKey: 'faq.faq3A',
    category: 'services',
  },
  {
    id: 'faq-4',
    questionKey: 'faq.faq4Q',
    answerKey: 'faq.faq4A',
    category: 'support',
  },
  {
    id: 'faq-5',
    questionKey: 'faq.faq5Q',
    answerKey: 'faq.faq5A',
    category: 'partner',
  },
];

const categoryLabels: Record<string, string> = {
  services: 'faq.categoryServices',
  payment: 'faq.categoryPayment',
  support: 'faq.categorySupport',
  partner: 'faq.categoryPartner',
};

export function FaqSection() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;

    const query = searchQuery.toLowerCase();
    return faqItems.filter((item) => {
      const question = t(item.questionKey).toLowerCase();
      const answer = t(item.answerKey).toLowerCase();
      return question.includes(query) || answer.includes(query);
    });
  }, [searchQuery, t]);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-muted/30">
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
            {t('faq.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('faq.searchPlaceholder')}
              className="pl-10 focus-visible:ring-emerald-500"
            />
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          {filteredItems.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-emerald-100"
                >
                  <AccordionTrigger className="hover:text-emerald-700 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {t(categoryLabels[item.category] || 'faq.categoryGeneral')}
                      </span>
                      <span>{t(item.questionKey)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {t(item.answerKey)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('faq.noResults')}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
