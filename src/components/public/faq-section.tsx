'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
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
import { useDocumentTitle } from '@/hooks/use-document-title';

const TechPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.TechPatternSVG),
  { ssr: false }
);

interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
  category: string;
}

const faqItems: FaqItem[] = [
  // Services
  { id: 'faq-1', questionKey: 'faq.faq1Q', answerKey: 'faq.faq1A', category: 'services' },
  { id: 'faq-3', questionKey: 'faq.faq3Q', answerKey: 'faq.faq3A', category: 'services' },
  { id: 'faq-6', questionKey: 'faq.faq6Q', answerKey: 'faq.faq6A', category: 'services' },
  { id: 'faq-7', questionKey: 'faq.faq7Q', answerKey: 'faq.faq7A', category: 'services' },
  { id: 'faq-8', questionKey: 'faq.faq8Q', answerKey: 'faq.faq8A', category: 'services' },
  { id: 'faq-9', questionKey: 'faq.faq9Q', answerKey: 'faq.faq9A', category: 'services' },
  { id: 'faq-10', questionKey: 'faq.faq10Q', answerKey: 'faq.faq10A', category: 'services' },
  { id: 'faq-11', questionKey: 'faq.faq11Q', answerKey: 'faq.faq11A', category: 'services' },
  // Payment
  { id: 'faq-2', questionKey: 'faq.faq2Q', answerKey: 'faq.faq2A', category: 'payment' },
  { id: 'faq-12', questionKey: 'faq.faq12Q', answerKey: 'faq.faq12A', category: 'payment' },
  { id: 'faq-13', questionKey: 'faq.faq13Q', answerKey: 'faq.faq13A', category: 'payment' },
  { id: 'faq-14', questionKey: 'faq.faq14Q', answerKey: 'faq.faq14A', category: 'payment' },
  { id: 'faq-15', questionKey: 'faq.faq15Q', answerKey: 'faq.faq15A', category: 'payment' },
  { id: 'faq-16', questionKey: 'faq.faq16Q', answerKey: 'faq.faq16A', category: 'payment' },
  // Support
  { id: 'faq-4', questionKey: 'faq.faq4Q', answerKey: 'faq.faq4A', category: 'support' },
  { id: 'faq-17', questionKey: 'faq.faq17Q', answerKey: 'faq.faq17A', category: 'support' },
  { id: 'faq-18', questionKey: 'faq.faq18Q', answerKey: 'faq.faq18A', category: 'support' },
  { id: 'faq-19', questionKey: 'faq.faq19Q', answerKey: 'faq.faq19A', category: 'support' },
  { id: 'faq-20', questionKey: 'faq.faq20Q', answerKey: 'faq.faq20A', category: 'support' },
  // Partner
  { id: 'faq-5', questionKey: 'faq.faq5Q', answerKey: 'faq.faq5A', category: 'partner' },
  { id: 'faq-21', questionKey: 'faq.faq21Q', answerKey: 'faq.faq21A', category: 'partner' },
  { id: 'faq-22', questionKey: 'faq.faq22Q', answerKey: 'faq.faq22A', category: 'partner' },
  { id: 'faq-23', questionKey: 'faq.faq23Q', answerKey: 'faq.faq23A', category: 'partner' },
  { id: 'faq-24', questionKey: 'faq.faq24Q', answerKey: 'faq.faq24A', category: 'partner' },
  // General
  { id: 'faq-25', questionKey: 'faq.faq25Q', answerKey: 'faq.faq25A', category: 'general' },
  { id: 'faq-26', questionKey: 'faq.faq26Q', answerKey: 'faq.faq26A', category: 'general' },
  { id: 'faq-27', questionKey: 'faq.faq27Q', answerKey: 'faq.faq27A', category: 'general' },
  { id: 'faq-28', questionKey: 'faq.faq28Q', answerKey: 'faq.faq28A', category: 'general' },
  { id: 'faq-29', questionKey: 'faq.faq29Q', answerKey: 'faq.faq29A', category: 'general' },
  { id: 'faq-30', questionKey: 'faq.faq30Q', answerKey: 'faq.faq30A', category: 'general' },
  { id: 'faq-31', questionKey: 'faq.faq31Q', answerKey: 'faq.faq31A', category: 'general' },
  // Privacy & Security
  { id: 'faq-32', questionKey: 'faq.faq32Q', answerKey: 'faq.faq32A', category: 'general' },
  // Refunds
  { id: 'faq-33', questionKey: 'faq.faq33Q', answerKey: 'faq.faq33A', category: 'payment' },
  // Delivery timeline
  { id: 'faq-34', questionKey: 'faq.faq34Q', answerKey: 'faq.faq34A', category: 'services' },
  // Custom quote
  { id: 'faq-35', questionKey: 'faq.faq35Q', answerKey: 'faq.faq35A', category: 'services' },
  // Accessibility
  { id: 'faq-36', questionKey: 'faq.faq36Q', answerKey: 'faq.faq36A', category: 'general' },
  // Mobile app
  { id: 'faq-37', questionKey: 'faq.faq37Q', answerKey: 'faq.faq37A', category: 'general' },
  // Account deletion
  { id: 'faq-38', questionKey: 'faq.faq38Q', answerKey: 'faq.faq38A', category: 'support' },
  // Cookie management
  { id: 'faq-39', questionKey: 'faq.faq39Q', answerKey: 'faq.faq39A', category: 'general' },
  // International clients
  { id: 'faq-40', questionKey: 'faq.faq40Q', answerKey: 'faq.faq40A', category: 'general' },
  // Partnership requirements
  { id: 'faq-41', questionKey: 'faq.faq41Q', answerKey: 'faq.faq41A', category: 'partner' },
];

const categoryLabels: Record<string, string> = {
  services: 'faq.categoryServices',
  payment: 'faq.categoryPayment',
  support: 'faq.categorySupport',
  partner: 'faq.categoryPartner',
  general: 'faq.categoryGeneral',
};

const categoryOrder = ['services', 'payment', 'support', 'partner', 'general'];

export function FaqSection() {
  const { t } = useLanguage();
  useDocumentTitle('nav.faq', 'FAQ');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredItems = useMemo(() => {
    let items = faqItems;

    // Filter by category
    if (activeCategory !== 'all') {
      items = items.filter((item) => item.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const question = t(item.questionKey).toLowerCase();
        const answer = t(item.answerKey).toLowerCase();
        return question.includes(query) || answer.includes(query);
      });
    }

    // Sort by category order
    items.sort((a, b) => {
      const aIdx = categoryOrder.indexOf(a.category);
      const bIdx = categoryOrder.indexOf(b.category);
      return aIdx - bIdx;
    });

    return items;
  }, [searchQuery, activeCategory, t]);

  return (
    <section id="faq" className="relative py-16 sm:py-24 bg-muted/30 overflow-hidden">
      {/* Decorative background */}
      <Suspense fallback={null}>
        <TechPatternSVG className="bottom-[5%] left-[2%] w-[250px] h-[250px]" opacity={0.03} />
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
          className="max-w-xl mx-auto mb-6"
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

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-2 justify-center mb-8"
        >
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
            }`}
          >
            {t('faq.categoryAll')}
          </button>
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              {t(categoryLabels[cat])}
            </button>
          ))}
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
                  className="border-emerald-100 dark:border-emerald-900/30"
                >
                  <AccordionTrigger className="hover:text-emerald-700 dark:hover:text-emerald-300 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded shrink-0">
                        {t(categoryLabels[item.category])}
                      </span>
                      <span className="text-sm">{t(item.questionKey)}</span>
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
