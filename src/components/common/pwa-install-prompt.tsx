'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { isCapacitorApp } from '@/lib/api-base';

// Storage key for "Don't show again" preference
const PWA_DISMISSED_KEY = 'carsai-pwa-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  // Check if we're on Capacitor (native app) and if user already dismissed
  useEffect(() => {
    // Don't show on native apps
    if (isCapacitorApp()) {
      setIsCapacitor(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
    if (dismissed === 'true') {
      return;
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    if (isCapacitor) return;

    const handler = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the custom install banner
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isCapacitor]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // User accepted the install prompt
        setShowBanner(false);
      }
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
    } finally {
      // Clear the deferred prompt - it can only be used once
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    // Persist dismissal so the banner doesn't reappear on navigation
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    setShowBanner(false);
    setDeferredPrompt(null);
  }, []);

  const handleDontShowAgain = useCallback(() => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    setShowBanner(false);
    setDeferredPrompt(null);
  }, []);

  // Don't render on Capacitor native apps or if banner shouldn't show
  if (isCapacitor || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md"
        >
          <Card className="border-red-200 shadow-lg bg-white dark:bg-zinc-900 dark:border-red-900/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                  <Download className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('pwa.installTitle')}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('pwa.installDesc')}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                      onClick={handleInstall}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      {t('pwa.install')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleDontShowAgain}
                    >
                      {t('pwa.dismiss')}
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
