'use client';

/**
 * Carsai Mozambique — Ad Rendering Components
 *
 * Components for rendering ads on the public site:
 * - AdRenderer: Renders a single ad based on its type/format
 * - BannerAd: Banner ad component
 * - InterstitialAd: Full-screen overlay with close button, auto-dismiss
 * - SidebarAd: Sidebar ad component
 * - NativeAd: Native ad component (blends with content)
 * - AdPlacement: Fetches and renders ads for a given placement
 *
 * Features:
 * - Impression tracking on mount
 * - Click tracking via /api/ads/[id]/stats
 * - Pixel URL firing via hidden <img> tags
 * - Interstitial 30-minute cooldown per session
 * - "Ad" label on all ad components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { AD_PLACEMENTS, type AdPlacementId } from '@/lib/ad-placements';
import { useLanguage } from '@/contexts/language-context';

// ── Types ──

export interface AdData {
  id: string;
  title: string;
  description: string;
  type: 'banner' | 'interstitial' | 'sidebar' | 'native' | 'video' | 'rich_media';
  format: 'html' | 'script' | 'image_base64' | 'video_base64' | 'text_quill' | 'url';
  content: string;
  targetUrl: string;
  placement: string[];
  status: string;
  priority: number;
  impressions: number;
  clicks: number;
  conversions: number;
  maxImpressions: number;
  maxClicks: number;
  startDate: string;
  endDate: string | null;
  pixelUrls: string[];
  clickPixelUrls: string[];
  conversionPixelUrls: string[];
  partnerId: string;
  planId: string;
  autoDeactivate: boolean;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ──

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('carsai-session-id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('carsai-session-id', sid);
  }
  return sid;
}

function trackEvent(adId: string, event: 'click' | 'conversion' | 'close', placement?: string) {
  const sessionId = getSessionId();
  if (!sessionId) return;

  apiFetch(`/api/ads/${adId}/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, sessionId, placement }),
  }).catch(() => {
    // Silently ignore tracking errors
  });
}

function firePixelImg(url: string) {
  if (typeof document === 'undefined') return;
  const img = document.createElement('img');
  img.src = url;
  img.width = 1;
  img.height = 1;
  img.style.position = 'absolute';
  img.style.left = '-9999px';
  img.alt = '';
  document.body.appendChild(img);
  // Remove after 10 seconds
  setTimeout(() => {
    try { document.body.removeChild(img); } catch { /* ignore */ }
  }, 10000);
}

// ── Ad Label ──

function AdLabel() {
  const { t } = useLanguage();
  return (
    <span className="inline-block text-[10px] uppercase tracking-wider text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded-sm mb-1">
      {t('ads.title') || 'Ad'}
    </span>
  );
}

// ── Content Renderer ──

function AdContent({ ad }: { ad: AdData }) {
  const { format, content, targetUrl } = ad;

  // HTML format - render in sandboxed div
  if (format === 'html') {
    return (
      <div
        className="ad-content-html"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Script format - render in sandboxed iframe
  if (format === 'script') {
    return (
      <iframe
        srcDoc={`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head><body>${content}</body></html>`}
        sandbox="allow-scripts allow-popups"
        className="w-full border-0 min-h-[60px]"
        title="Ad"
      />
    );
  }

  // Image base64 format
  if (format === 'image_base64') {
    const src = content.startsWith('data:') ? content : `data:image/png;base64,${content}`;
    return (
      <img
        src={src}
        alt={ad.title || 'Advertisement'}
        className="max-w-full h-auto rounded"
        loading="lazy"
      />
    );
  }

  // Video base64 format
  if (format === 'video_base64') {
    const src = content.startsWith('data:') ? content : `data:video/mp4;base64,${content}`;
    return (
      <video
        src={src}
        className="max-w-full h-auto rounded"
        controls
        muted
        playsInline
        autoPlay
        loop
      />
    );
  }

  // Text/Quill format - render the HTML output from Quill
  if (format === 'text_quill') {
    return (
      <div
        className="ad-content-quill prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // URL format - load via iframe
  if (format === 'url') {
    return (
      <iframe
        src={content}
        className="w-full border-0 min-h-[60px]"
        sandbox="allow-scripts allow-popups allow-same-origin"
        title="Ad"
        loading="lazy"
      />
    );
  }

  return null;
}

// ── Clickable Wrapper ──

function ClickableAd({
  ad,
  placement,
  children,
  className = '',
}: {
  ad: AdData;
  placement?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handleClick = useCallback(() => {
    // Track click
    trackEvent(ad.id, 'click', placement);

    // Fire click pixel URLs
    if (ad.clickPixelUrls && ad.clickPixelUrls.length > 0) {
      ad.clickPixelUrls.forEach(firePixelImg);
    }

    // Open target URL
    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  }, [ad.id, ad.targetUrl, ad.clickPixelUrls, placement]);

  return (
    <div
      className={`cursor-pointer group ${className}`}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
}

// ── Banner Ad ──

function BannerAd({ ad, placement }: { ad: AdData; placement?: string }) {
  return (
    <div className="relative w-full">
      <AdLabel />
      <ClickableAd ad={ad} placement={placement}>
        <div className="rounded-lg overflow-hidden border border-border/30 bg-background shadow-sm hover:shadow-md transition-shadow">
          <AdContent ad={ad} />
        </div>
      </ClickableAd>
      {/* Impression pixel URLs */}
      {ad.pixelUrls?.map((url, i) => (
        <img key={i} src={url} width={1} height={1} alt="" className="absolute -left-[9999px]" />
      ))}
    </div>
  );
}

// ── Sidebar Ad ──

function SidebarAd({ ad, placement }: { ad: AdData; placement?: string }) {
  return (
    <div className="relative w-full">
      <AdLabel />
      <ClickableAd ad={ad} placement={placement}>
        <div className="rounded-lg overflow-hidden border border-border/30 bg-background shadow-sm hover:shadow-md transition-shadow p-3">
          <AdContent ad={ad} />
        </div>
      </ClickableAd>
      {ad.pixelUrls?.map((url, i) => (
        <img key={i} src={url} width={1} height={1} alt="" className="absolute -left-[9999px]" />
      ))}
    </div>
  );
}

// ── Native Ad ──

function NativeAd({ ad, placement }: { ad: AdData; placement?: string }) {
  return (
    <div className="relative w-full">
      <AdLabel />
      <ClickableAd ad={ad} placement={placement}>
        <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
          {ad.title && (
            <h4 className="font-semibold text-sm mb-1 group-hover:underline">{ad.title}</h4>
          )}
          {ad.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{ad.description}</p>
          )}
          <AdContent ad={ad} />
        </div>
      </ClickableAd>
      {ad.pixelUrls?.map((url, i) => (
        <img key={i} src={url} width={1} height={1} alt="" className="absolute -left-[9999px]" />
      ))}
    </div>
  );
}

// ── Interstitial Ad ──

const INTERSTITIAL_COOLDOWN = 30 * 60 * 1000; // 30 minutes

function InterstitialAd({ ad, placement, onClose }: { ad: AdData; placement?: string; onClose: () => void }) {
  const [countdown, setCountdown] = useState(5);
  const canClose = countdown <= 0;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClose = useCallback(() => {
    if (!canClose) return;
    trackEvent(ad.id, 'close', placement);
    onClose();
  }, [canClose, ad.id, placement, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) handleClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-lg w-full mx-4 bg-background rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`absolute top-3 right-3 z-10 rounded-full p-1.5 transition-colors ${
            canClose
              ? 'bg-background/80 hover:bg-background text-foreground shadow-md cursor-pointer'
              : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
          }`}
          aria-label="Close ad"
        >
          {canClose ? <X className="h-4 w-4" /> : <span className="text-xs font-medium px-1">{countdown}s</span>}
        </button>

        {/* Ad label */}
        <div className="p-4 pb-0">
          <AdLabel />
        </div>

        {/* Content */}
        <ClickableAd ad={ad} placement={placement}>
          <div className="p-4">
            {ad.title && (
              <h3 className="font-semibold text-lg mb-2 group-hover:underline">{ad.title}</h3>
            )}
            <AdContent ad={ad} />
          </div>
        </ClickableAd>

        {/* Impression pixels */}
        {ad.pixelUrls?.map((url, i) => (
          <img key={i} src={url} width={1} height={1} alt="" className="absolute -left-[9999px]" />
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Main Ad Renderer ──

export function AdRenderer({ ad, placement }: { ad: AdData; placement?: string }) {
  // Track impression on mount
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Fire impression pixel URLs
    if (ad.pixelUrls && ad.pixelUrls.length > 0) {
      ad.pixelUrls.forEach(firePixelImg);
    }
  }, [ad.id, ad.pixelUrls]);

  switch (ad.type) {
    case 'banner':
      return <BannerAd ad={ad} placement={placement} />;
    case 'sidebar':
      return <SidebarAd ad={ad} placement={placement} />;
    case 'native':
      return <NativeAd ad={ad} placement={placement} />;
    case 'interstitial':
      // Interstitial ads are handled by AdPlacement which uses the InterstitialAd directly
      return <BannerAd ad={ad} placement={placement} />;
    case 'video':
      return <BannerAd ad={ad} placement={placement} />;
    case 'rich_media':
      return <BannerAd ad={ad} placement={placement} />;
    default:
      return <BannerAd ad={ad} placement={placement} />;
  }
}

// ── Ad Placement Component ──

export function AdPlacement({ placement, className }: { placement: AdPlacementId | string; className?: string }) {
  const [ads, setAds] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [interstitialAd, setInterstitialAd] = useState<AdData | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Fetch ads for placement
  useEffect(() => {
    let mounted = true;

    async function fetchAds() {
      try {
        const res = await apiFetch(`/api/ads?placement=${placement}&limit=5`);
        const data = await safeJson<{ success: boolean; data: AdData[] }>(res);

        if (mounted && data?.success && data.data) {
          const placementConfig = AD_PLACEMENTS[placement as AdPlacementId];

          // Separate interstitials from regular ads
          const regular = data.data.filter((ad) => ad.type !== 'interstitial');
          const interstitials = data.data.filter((ad) => ad.type === 'interstitial');

          setAds(regular);

          // Handle interstitial with cooldown
          if (placementConfig?.type === 'interstitial' && interstitials.length > 0) {
            const ad = interstitials[0];
            const lastShown = localStorage.getItem(`carsai-interstitial-last-${ad.id}`);
            const now = Date.now();

            if (!lastShown || now - parseInt(lastShown, 10) > INTERSTITIAL_COOLDOWN) {
              setInterstitialAd(ad);
              setShowInterstitial(true);
            }
          }
        }
      } catch {
        // Silently ignore fetch errors
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAds();
    return () => { mounted = false; };
  }, [placement]);

  // Handle interstitial close
  const handleInterstitialClose = useCallback(() => {
    if (interstitialAd) {
      localStorage.setItem(`carsai-interstitial-last-${interstitialAd.id}`, Date.now().toString());
    }
    setShowInterstitial(false);
  }, [interstitialAd]);

  // Don't render anything while loading or if no ads
  if (loading) return null;
  if (ads.length === 0 && !interstitialAd) return null;

  return (
    <div className={className}>
      {/* Regular ads */}
      {ads.map((ad) => (
        <AdRenderer key={ad.id} ad={ad} placement={placement} />
      ))}

      {/* Interstitial ad */}
      <AnimatePresence>
        {showInterstitial && interstitialAd && (
          <InterstitialAd
            ad={interstitialAd}
            placement={placement}
            onClose={handleInterstitialClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
