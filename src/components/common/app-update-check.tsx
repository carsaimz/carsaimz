'use client';

/**
 * Carsai Mozambique — App Update Check Component
 *
 * Checks for updates by comparing the current app version (APP_VERSION)
 * with the latest GitHub release tag. Shows a dialog when an update
 * is available with download options.
 *
 * Works on ALL platforms:
 * - Native (Capacitor): Download APK directly via system browser
 * - Web: Show "Visit download page" button or direct APK download
 * - Windows/Electron: Download .exe from GitHub releases
 *
 * Background checks every 30 minutes when app is in foreground.
 * Uses react-markdown for changelog rendering.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { APP_VERSION } from '@/lib/client-config';
import { isCapacitorApp, isElectronApp } from '@/lib/api-base';
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
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, X, Loader2, CheckCircle2, ExternalLink, Monitor } from 'lucide-react';

// ─── Constants ───

const GITHUB_REPO = 'carsaimz/carsai-mozambique';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
const LAST_CHECK_KEY = 'carsai-update-last-check';
const SKIPPED_VERSION_KEY = 'carsai-update-skipped-version';
const CHECK_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const FOREGROUND_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

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

// ─── Platform type ───

type Platform = 'android' | 'windows' | 'web';

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

function findExeAsset(assets: Array<{ name: string; browser_download_url: string }>): string | null {
  const exe = assets.find(
    (a) => a.name.endsWith('.exe') || a.name.endsWith('.msi')
  );
  return exe?.browser_download_url || null;
}

function getAssetSize(assets: GitHubRelease['assets'], url: string | null): number {
  if (!url) return 0;
  const asset = assets.find((a) => a.browser_download_url === url);
  return asset?.size || 0;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Detect platform ───

function detectPlatform(): Platform {
  if (isCapacitorApp()) return 'android';
  if (isElectronApp()) return 'windows';
  return 'web';
}

// ─── Native download helper ───

async function nativeDownloadApk(url: string): Promise<void> {
  window.open(url, '_system');
}

// ─── Component ───

export function AppUpdateCheck() {
  const { t } = useLanguage();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [exeUrl, setExeUrl] = useState<string | null>(null);
  const [downloadSize, setDownloadSize] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [platform, setPlatform] = useState<Platform>('web');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Detect platform ──
  useEffect(() => {
    setPlatform(detectPlatform());
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

        const apk = findApkAsset(release.assets);
        const exe = findExeAsset(release.assets);

        setLatestVersion(latestTag);
        setChangelog(release.body || '');
        setApkUrl(apk);
        setExeUrl(exe);
        setDownloadSize(getAssetSize(release.assets, apk || exe));
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
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();

    if (lastCheck && now - parseInt(lastCheck, 10) < CHECK_COOLDOWN_MS) {
      // Still in cooldown, but still check silently
      return;
    }

    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  // ── Background check every 30 minutes ──
  useEffect(() => {
    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, FOREGROUND_CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkForUpdates]);

  // ── Handle "Remind me later" ──
  const handleRemindLater = () => {
    if (latestVersion) {
      localStorage.setItem(SKIPPED_VERSION_KEY, latestVersion);
    }
    setShowDialog(false);
  };

  // ── Download with progress tracking ──
  const downloadWithProgress = async (url: string, filename: string) => {
    setDownloadState('downloading');
    setDownloadProgress(0);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);

      const contentLength = Number(response.headers.get('content-length') || 0);
      const total = contentLength || downloadSize || 0;

      if (!response.body) {
        // Fallback: no readable stream support
        window.open(url, '_blank');
        setDownloadState('complete');
        return;
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          setDownloadProgress(progress);
        } else {
          // Unknown total size — show indeterminate progress
          setDownloadProgress(Math.min(90, receivedLength / 10000));
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks as BlobPart[]);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setDownloadProgress(100);
      setDownloadState('complete');
    } catch (err) {
      console.error('[AppUpdateCheck] Download failed:', err);
      setDownloadState('failed');
    }
  };

  // ── Handle download based on platform ──
  const handleDownload = async () => {
    if (platform === 'android' && apkUrl) {
      if (isCapacitorApp()) {
        // On native app: use system browser to trigger download manager
        setDownloadState('downloading');
        try {
          await nativeDownloadApk(apkUrl);
          setDownloadProgress(100);
          setDownloadState('complete');
        } catch {
          setDownloadState('failed');
        }
      } else {
        // Web browser on Android — download with progress
        const filename = apkUrl.split('/').pop() || 'app.apk';
        await downloadWithProgress(apkUrl, filename);
      }
    } else if (platform === 'windows' && exeUrl) {
      const filename = exeUrl.split('/').pop() || 'CarsaiMozambique-Setup.exe';
      await downloadWithProgress(exeUrl, filename);
    } else if (apkUrl) {
      // Web platform — download APK with progress
      const filename = apkUrl.split('/').pop() || 'app.apk';
      await downloadWithProgress(apkUrl, filename);
    }
  };

  // ── Visit download page (for web users) ──
  const handleVisitDownloadPage = () => {
    window.open(GITHUB_RELEASES_URL, '_blank');
  };

  // ── Get the appropriate download URL for current platform ──
  const getDownloadUrl = (): string | null => {
    if (platform === 'android' && apkUrl) return apkUrl;
    if (platform === 'windows' && exeUrl) return exeUrl;
    if (apkUrl) return apkUrl; // Web fallback to APK
    return null;
  };

  // ── Download button text based on state and platform ──
  const getDownloadButtonText = () => {
    if (downloadState === 'downloading') return t('update.downloading');
    if (downloadState === 'complete') return t('update.downloadComplete');
    if (downloadState === 'failed') return t('update.installFailed');

    if (platform === 'windows') return t('update.downloadExe') || 'Download .exe';
    if (platform === 'android') return t('update.downloadApk');
    return t('update.downloadApk');
  };

  const getDownloadButtonIcon = () => {
    switch (downloadState) {
      case 'downloading': return <Loader2 className="size-4 animate-spin" />;
      case 'complete': return <CheckCircle2 className="size-4" />;
      case 'failed': return <RefreshCw className="size-4" />;
      default:
        if (platform === 'windows') return <Monitor className="size-4" />;
        return <Download className="size-4" />;
    }
  };

  return (
    <>
      {/* Persistent update notification bar */}
      {updateAvailable && !showDialog && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-3 flex items-center gap-2">
            <RefreshCw className="size-4 shrink-0" />
            <span className="text-sm font-medium truncate">
              {t('update.available')}: v{latestVersion}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20 ml-auto shrink-0"
              onClick={() => setShowDialog(true)}
            >
              {t('update.download')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
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

            {/* Platform indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {platform === 'android' && <Download className="size-3" />}
              {platform === 'windows' && <Monitor className="size-3" />}
              {platform === 'web' && <ExternalLink className="size-3" />}
              <span>
                {platform === 'android' && 'Android'}
                {platform === 'windows' && 'Windows'}
                {platform === 'web' && 'Web'}
              </span>
              {downloadSize > 0 && (
                <>
                  <span>·</span>
                  <span>{formatBytes(downloadSize)}</span>
                </>
              )}
            </div>

            {/* Changelog with markdown rendering */}
            {changelog && (
              <div>
                <p className="text-sm font-medium mb-2">{t('update.changelog')}</p>
                <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto text-sm prose prose-sm dark:prose-invert prose-headings:mb-1 prose-headings:mt-2 prose-p:mb-1 prose-li:mb-0.5 prose-ul:mb-1">
                  <ReactMarkdown>{changelog}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Download progress bar */}
            {downloadState === 'downloading' && (
              <div className="space-y-2">
                <Progress value={downloadProgress} className="h-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t('update.downloading')} {downloadProgress > 0 ? `${downloadProgress}%` : ''}
                </div>
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
                <RefreshCw className="size-4" />
                {t('update.installFailed')}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRemindLater}>
              {t('update.remindLater')}
            </Button>
            {platform === 'web' && !getDownloadUrl() ? (
              /* Web users with no direct download — visit GitHub releases page */
              <Button
                onClick={handleVisitDownloadPage}
                className="gap-2"
              >
                <ExternalLink className="size-4" />
                {t('update.visitDownloadPage') || 'Visit download page'}
              </Button>
            ) : getDownloadUrl() ? (
              /* Direct download available */
              <Button
                onClick={handleDownload}
                className="gap-2"
                disabled={downloadState === 'downloading'}
              >
                {getDownloadButtonIcon()}
                {getDownloadButtonText()}
              </Button>
            ) : (
              /* Fallback — visit download page */
              <Button
                onClick={handleVisitDownloadPage}
                className="gap-2"
              >
                <ExternalLink className="size-4" />
                {t('update.visitDownloadPage') || 'Visit download page'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
