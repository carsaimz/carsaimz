'use client';

/**
 * Carsai Mozambique — Database Setup Component
 *
 * Shows a small banner at the top of the page when the database hasn't been seeded yet.
 * Only visible to authenticated admin users.
 * Includes a "Don't show again" option that persists in localStorage.
 * Auto-dismisses after successful seeding.
 */

import { useState, useEffect } from 'react';
import { seedInitialData, isDatabaseSeeded } from '@/lib/client-seed';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { X, Database, EyeOff } from 'lucide-react';

const DISMISS_KEY = 'carsai_db_setup_dismissed';

export function DatabaseSetup() {
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin } = useAuth();
  const [show, setShow] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      // Only show to authenticated admin users
      if (!isAuthenticated || !isAdmin) {
        setChecking(false);
        return;
      }

      // Check if user dismissed the banner
      try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed === 'true') {
          setChecking(false);
          return;
        }
      } catch {
        // localStorage not available
      }

      try {
        const seeded = await isDatabaseSeeded();
        if (!seeded) {
          setShow(true);
        }
      } catch (err) {
        console.warn('[DatabaseSetup] Could not check seed status:', err);
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [isAuthenticated, isAdmin]);

  const handleSeed = async () => {
    if (!isAuthenticated) {
      setResult({
        success: false,
        message: t('setup.dbSetup.authRequired'),
      });
      return;
    }

    setSeeding(true);
    try {
      const res = await seedInitialData();
      setResult(res);
      if (res.success) {
        // Auto-dismiss after successful seeding
        setTimeout(() => {
          setShow(false);
          // Persist dismissal so it doesn't show again
          try {
            localStorage.setItem(DISMISS_KEY, 'true');
          } catch {
            // ignore
          }
        }, 2000);
      }
    } catch (err) {
      setResult({ success: false, message: String(err) });
    } finally {
      setSeeding(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

  const handleDontShowAgain = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (!show || checking) return null;

  return (
    <div className="sticky top-0 z-50 w-full border-b border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/80">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Database className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
            {t('setup.dbSetup.title')}
            {isAuthenticated
              ? ` — ${t('setup.dbSetup.clickInitialize')}`
              : ` — ${t('setup.dbSetup.createAccountFirst')}`
            }
          </p>

          {result && (
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              result.success
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
            }`}>
              {result.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              {seeding ? t('setup.dbSetup.initializing') : t('setup.dbSetup.initialize')}
            </button>
          )}
          <button
            onClick={handleDontShowAgain}
            className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
            title={t('common.dontShowAgain') || "Don't show again"}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
            title={t('common.dismiss') || 'Dismiss'}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
