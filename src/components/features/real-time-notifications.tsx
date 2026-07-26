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
  const { addNotification, notifications } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();
  const lastFetchRef = useRef<number>(0);

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
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success && data.data) {
        const currentNotifs = notifications;
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

          // ── Show toast for new notifications ──
          const Icon = typeIcons[notif.type as NotificationType] || Bell;
          const colorClass = typeColors[notif.type as NotificationType] || 'text-muted-foreground';

          toast({
            title: notif.title || t('notif.newNotification'),
            description: notif.message || '',
            variant: notif.type === 'error' ? 'destructive' : 'default',
          });
        }
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
    }

    lastFetchRef.current = Date.now();
  }, [isAuthenticated, addNotification, notifications, t]);

  // ── Initial fetch on mount ──
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Poll every 30 seconds for new notifications ──
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
