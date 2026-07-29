'use client';

/**
 * Carsai Mozambique — App Update Check Component
 *
 * Checks for updates by comparing the current app version (APP_VERSION)
 * with the latest GitHub release tag. Shows a dialog when an update
 * is available with download APK button.
 *
 * On Capacitor native apps, uses the Filesystem + Browser plugins to
 * download and install the APK directly. On web, opens the download URL.
 *
 * Auto-checks on mount with a 24h cooldown (stored in localStorage).
 */

import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION } from '@/lib/client-config';
import { isCapacitorApp } from '@/lib/api-base';
import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, X, Loader2, CheckCircle2 } from 'lucide-react';

// ─── Constants ───

const GITHUB_REPO = 'carsaimz/carsai-mozambique';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const LAST_CHECK_KEY = 'carsai-update-last-check';
const SKIPPED_VERSION_KEY = 'carsai-update-skipped-version';
const CHECK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── GitHub Release type ───

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
  }>;
}

// ─── Download states ───

type DownloadState = 'idle' | 'downloading' | 'complete' | 'failed';

// ─── Semver comparison ───

function parseSemver(version: string): [number, number, number] {
  const clean = version.replace(/^v/, '');
  const parts = clean.split('.');
  return [
    parseInt(parts[0] || '0', 10),
    parseInt(parts[1] || '0', 10),
    parseInt(parts[2] || '0', 10),
  ];
}

function isNewerVersion(current: string, latest: string): boolean {
  const c = parseSemver(current);
  const l = parseSemver(latest);

  if (l[0] > c[0]) return true;
  if (l[0] === c[0] && l[1] > c[1]) return true;
  if (l[0] === c[0] && l[1] === c[1] && l[2] > c[2]) return true;
  return false;
}

function findApkAsset(assets: Array<{ name: string; browser_download_url: string }>): string | null {
  const apk = assets.find((a) => a.name.endsWith('.apk'));
  return apk?.browser_download_url || null;
}

// ─── Native download helper ───
// Uses Capacitor Browser plugin to open the APK download URL in the system browser,
// which triggers the native Android download manager.

async function nativeDownloadApk(url: string): Promise<void> {
  try {
    // Try using Capacitor Browser plugin (opens in system browser for download)
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch {
    // Fallback: open in current window
    window.open(url, '_system');
  }
}

// ─── Component ───

export function AppUpdateCheck() {
  const { t } = useLanguage();
  const [isNative, setIsNative] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');

  // ── Check if running on native app ──
  useEffect(() => {
    setIsNative(isCapacitorApp());
  }, []);

  // ── Check for updates ──
  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    setError(null);

    try {
      const res = await fetch(GITHUB_API_URL);
      if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}`);
      }

      const release: GitHubRelease = await res.json();
      const latestTag = release.tag_name;

      if (isNewerVersion(APP_VERSION, latestTag)) {
        // Check if user skipped this version
        const skippedVersion = localStorage.getItem(SKIPPED_VERSION_KEY);
        if (skippedVersion === latestTag) {
          setChecking(false);
          return;
        }

        setLatestVersion(latestTag);
        setChangelog(release.body || '');
        setApkUrl(findApkAsset(release.assets));
        setUpdateAvailable(true);
        setShowDialog(true);
      } else {
        setUpdateAvailable(false);
      }

      // Store last check time
      localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    } catch (err) {
      console.warn('[AppUpdateCheck] Failed to check for updates:', err);
      setError(String(err));
    } finally {
      setChecking(false);
    }
  }, []);

  // ── Auto-check on mount (with cooldown) ──
  useEffect(() => {
    if (!isNative) return;

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();

    if (lastCheck && now - parseInt(lastCheck, 10) < CHECK_COOLDOWN_MS) {
      return;
    }

    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isNative, checkForUpdates]);

  // ── Handle "Remind me later" ──
  const handleRemindLater = () => {
    if (latestVersion) {
      localStorage.setItem(SKIPPED_VERSION_KEY, latestVersion);
    }
    setShowDialog(false);
  };

  // ── Handle download APK ──
  const handleDownloadApk = async () => {
    if (!apkUrl) return;

    setDownloadState('downloading');

    try {
      if (isCapacitorApp()) {
        // On native app: use Capacitor Browser plugin to open download URL
        // This triggers the Android system download manager
        await nativeDownloadApk(apkUrl);
        setDownloadState('complete');
      } else {
        // On web: open in new tab
        window.open(apkUrl, '_blank');
        setDownloadState('complete');
      }
    } catch (err) {
      console.error('[AppUpdateCheck] Download failed:', err);
      setDownloadState('failed');
    }
  };

  // ── Don't render anything if not on native app ──
  if (!isNative) {
    return null;
  }

  // ── Download button text based on state ──
  const getDownloadButtonText = () => {
    switch (downloadState) {
      case 'downloading': return t('update.downloading');
      case 'complete': return t('update.downloadComplete');
      case 'failed': return t('update.installFailed');
      default: return t('update.downloadApk');
    }
  };

  const getDownloadButtonIcon = () => {
    switch (downloadState) {
      case 'downloading': return <Loader2 className="size-4 animate-spin" />;
      case 'complete': return <CheckCircle2 className="size-4" />;
      case 'failed': return <RefreshCw className="size-4" />;
      default: return <Download className="size-4" />;
    }
  };

  return (
    <>
      {/* Update available notification bar */}
      {updateAvailable && !showDialog && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-3 flex items-center gap-2">
            <RefreshCw className="size-4" />
            <span className="text-sm font-medium">
              {t('update.available')}: v{latestVersion}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20 ml-auto"
              onClick={() => setShowDialog(true)}
            >
              {t('update.download')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleRemindLater}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Update dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="size-5" />
              {t('update.available')}
            </DialogTitle>
            <DialogDescription>
              {t('update.available')} — v{latestVersion}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Version comparison */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t('update.currentVersion')}</p>
                <Badge variant="outline" className="mt-1">v{APP_VERSION}</Badge>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t('update.latestVersion')}</p>
                <Badge variant="default" className="mt-1">v{latestVersion}</Badge>
              </div>
            </div>

            {/* Changelog */}
            {changelog && (
              <div>
                <p className="text-sm font-medium mb-2">{t('update.changelog')}</p>
                <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                  {changelog}
                </div>
              </div>
            )}

            {/* Download progress */}
            {downloadState === 'downloading' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t('update.downloading')}
              </div>
            )}
            {downloadState === 'complete' && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" />
                {t('update.downloadComplete')}
              </div>
            )}
            {downloadState === 'failed' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                {t('update.installFailed')}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRemindLater}>
              {t('update.remindLater')}
            </Button>
            {apkUrl && (
              <Button
                onClick={handleDownloadApk}
                className="gap-2"
                disabled={downloadState === 'downloading'}
              >
                {getDownloadButtonIcon()}
                {getDownloadButtonText()}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
