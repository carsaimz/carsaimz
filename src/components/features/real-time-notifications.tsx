'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { useNotificationStore, type NotificationType } from '@/lib/store';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Real-Time Notifications Component
// ──────────────────────────────────────────────

export function RealTimeNotifications() {
  const { t } = useLanguage();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ── Ref to track initial fetch and prevent re-running mount effect ──
  const hasFetchedOnMount = useRef(false);
  const lastFetchRef = useRef<number>(0);

  // ── Set to track notification IDs that have already been shown as toast ──
  // This prevents duplicate toasts on subsequent poll cycles
  const shownToastIds = useRef<Set<string>>(new Set());

  // ── Notification type icon mapping ──
  const typeIcons: Record<NotificationType, typeof Bell> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const typeColors: Record<NotificationType, string> = {
    info: 'text-emerald-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  // ── Fetch notifications from API ──
  // Use getState() to read current notifications for deduplication without
  // subscribing to changes, which avoids the infinite loop bug.
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success && data.data) {
        // ── Read current notifications via getState() (no subscription) ──
        const currentNotifs = useNotificationStore.getState().notifications;
        const existingIds = new Set(currentNotifs.map((n) => n.id));

        // ── Add new notifications that aren't already in the store ──
        const newNotifs = data.data.filter(
          (n: { id: string }) => !existingIds.has(n.id)
        );

        for (const notif of newNotifs) {
          addNotification(
            notif.type as NotificationType,
            notif.title || t('notif.newNotification'),
            notif.message || ''
          );

          // ── Show toast only for notifications that haven't been shown as toast yet ──
          // This prevents the loop: only the first time a notification ID triggers a toast
          if (!shownToastIds.current.has(notif.id)) {
            shownToastIds.current.add(notif.id);

            toast({
              title: notif.title || t('notif.newNotification'),
              description: notif.message || '',
              variant: notif.type === 'error' ? 'destructive' : 'default',
            });
          }
        }
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
    }

    lastFetchRef.current = Date.now();
  }, [isAuthenticated, addNotification, t]);

  // ── Initial fetch on mount (only once, via ref guard) ──
  useEffect(() => {
    if (hasFetchedOnMount.current) return;
    hasFetchedOnMount.current = true;
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Poll every 30 seconds for new notifications ──
  // Use a ref-based interval setup so it doesn't depend on fetchNotifications recreation
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // ── This component is invisible — it only manages notification state ──
  return null;
}
