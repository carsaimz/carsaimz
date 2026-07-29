'use client';

/**
 * Carsai Mozambique — Database Setup Component
 *
 * Shows a setup prompt when the database hasn't been seeded yet.
 * Allows the user to seed initial data (roles, categories, settings, etc.)
 * directly from the browser.
 *
 * This component is auto-dismissed after seeding or when the user clicks "Skip".
 */

import { useState, useEffect } from 'react';
import { seedInitialData, isDatabaseSeeded } from '@/lib/client-seed';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export function DatabaseSetup() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
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
  }, []);

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
        setTimeout(() => setShow(false), 3000);
      }
    } catch (err) {
      setResult({ success: false, message: String(err) });
    } finally {
      setSeeding(false);
    }
  };

  if (!show || checking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-lg">
            🗄️
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {t('setup.dbSetup.title')}
            </h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('setup.dbSetup.description')}
          {isAuthenticated
            ? ` ${t('setup.dbSetup.clickInitialize')}`
            : ` ${t('setup.dbSetup.createAccountFirst')}`
          }
        </p>

        {result && (
          <div className={`text-sm p-3 rounded-lg mb-4 ${
            result.success
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.message}
          </div>
        )}

        <div className="flex gap-3">
          {isAuthenticated && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {seeding ? t('setup.dbSetup.initializing') : t('setup.dbSetup.initialize')}
            </button>
          )}
          <button
            onClick={() => setShow(false)}
            disabled={seeding}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground"
          >
            {t('common.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
