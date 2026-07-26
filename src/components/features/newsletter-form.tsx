'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Newsletter Form with API Integration
// ──────────────────────────────────────────────

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ── Email validation ──
  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // ── Handle submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage(t('newsletter.emailRequired'));
      setState('error');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage(t('newsletter.emailInvalid'));
      setState('error');
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setState('success');
        setEmail('');
        // Reset success after 5 seconds
        setTimeout(() => setState('idle'), 5000);
      } else {
        setErrorMessage(data.error || t('newsletter.subscribeError'));
        setState('error');
      }
    } catch {
      setErrorMessage(t('newsletter.subscribeError'));
      setState('error');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{t('newsletter.title')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('newsletter.subtitle')}
      </p>

      <AnimatePresence mode="wait">
        {state === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle className="size-4" />
            <span>{t('newsletter.subscribeSuccess')}</span>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder={t('newsletter.emailPlaceholder')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === 'error') setState('idle');
                    }}
                    disabled={state === 'loading'}
                    className="text-sm h-9 focus-visible:ring-emerald-500"
                    aria-label={t('newsletter.emailPlaceholder')}
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={state === 'loading'}
                  className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {state === 'loading' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Mail className="size-3.5" />
                  )}
                  <span className="ml-1">{t('newsletter.subscribe')}</span>
                </Button>
              </div>

              {state === 'error' && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400"
                >
                  <AlertCircle className="size-3" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </form>

            <p className="text-xs text-muted-foreground mt-1">
              {t('newsletter.privacyNote')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
