'use client';

/**
 * Carsai Mozambique — Push Notification Setup Component
 *
 * Handles FCM push notification registration for web browsers.
 * Prompts the user to enable notifications if not already registered,
 * and shows the current notification permission status.
 *
 * Uses Firebase Messaging (getMessaging, getToken) from @/lib/firebase-client.
 * On token received, sends it to /api/notifications/register-token API.
 *
 * i18n keys:
 *   - notifications.enablePush
 *   - notifications.pushEnabled
 *   - notifications.pushDisabled
 *   - notifications.pushBlocked
 */

import { useState, useEffect, useCallback } from 'react';
import { requestFCMToken, onForegroundMessage, messagingClient } from '@/lib/firebase-client';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { isCapacitorApp, isElectronApp } from '@/lib/api-base';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───

type PermissionStatus = 'default' | 'granted' | 'denied';

interface PushNotificationSetupProps {
  /** Compact mode — just show a badge/icon instead of full card */
  compact?: boolean;
  /** Called when the permission status changes */
  onPermissionChange?: (status: PermissionStatus) => void;
}

// ─── Component ───

export function PushNotificationSetup({ compact = false, onPermissionChange }: PushNotificationSetupProps) {
  const { t } = useLanguage();
  const { user, idToken } = useAuthStore();
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [loading, setLoading] = useState(false);
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Listen for foreground FCM messages and show toast ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    let unsubscribe: (() => void) | undefined;

    onForegroundMessage((payload) => {
      const title = payload?.notification?.title || 'Notification';
      const body = payload?.notification?.body || '';
      toast(title, {
        description: body,
        icon: <BellRing className="size-4" />,
      });
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // ── Check current permission status on mount ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const current = Notification.permission as PermissionStatus;
    setPermission(current);
    onPermissionChange?.(current);

    // Check if we already registered a token
    const storedToken = localStorage.getItem('carsai-fcm-token');
    if (storedToken && current === 'granted') {
      setTokenRegistered(true);
    }
  }, [onPermissionChange]);

  // ── Register FCM token with server ──
  const registerTokenWithServer = useCallback(async (token: string) => {
    if (!user?.id || !idToken) return;

    try {
      const platform = isCapacitorApp() ? 'android' : isElectronApp() ? 'windows' : 'web';

      const res = await apiFetch('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          token,
          platform,
        }),
      });

      const data = await safeJson(res);
      if (data?.success) {
        localStorage.setItem('carsai-fcm-token', token);
        setTokenRegistered(true);
      } else {
        console.warn('[PushNotificationSetup] Token registration failed:', data?.error);
        setError(data?.error || 'Registration failed');
      }
    } catch (err) {
      console.error('[PushNotificationSetup] Error registering token:', err);
      setError(String(err));
    }
  }, [user?.id, idToken]);

  // ── Request notification permission ──
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setError('Notifications not supported in this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, request browser permission
      const result = await Notification.requestPermission();
      const newPermission = result as PermissionStatus;
      setPermission(newPermission);
      onPermissionChange?.(newPermission);

      if (newPermission !== 'granted') {
        setLoading(false);
        return;
      }

      // Then, get FCM token
      const token = await requestFCMToken();
      if (token) {
        await registerTokenWithServer(token);
      } else {
        setError('Failed to get FCM token');
      }
    } catch (err) {
      console.error('[PushNotificationSetup] Error requesting permission:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [registerTokenWithServer, onPermissionChange]);

  // ── Don't show on native apps (they use native push) ──
  if (isCapacitorApp()) return null;

  // ── Check if browser supports notifications ──
  const supportsNotifications = typeof window !== 'undefined' && 'Notification' in window;

  if (!supportsNotifications) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="size-4" />
        <span>Notifications not supported in this browser</span>
      </div>
    );
  }

  // ── Must be logged in ──
  if (!user) return null;

  // ── Compact mode: just show status badge ──
  if (compact) {
    if (permission === 'granted' && tokenRegistered) {
      return (
        <Badge variant="default" className="gap-1 text-xs">
          <BellRing className="size-3" />
          {t('notifications.pushEnabled')}
        </Badge>
      );
    }

    if (permission === 'denied') {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <BellOff className="size-3" />
          {t('notifications.pushBlocked')}
        </Badge>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-xs"
        onClick={requestPermission}
        disabled={loading}
      >
        {loading ? <Loader2 className="size-3 animate-spin" /> : <Bell className="size-3" />}
        {t('notifications.enablePush')}
      </Button>
    );
  }

  // ── Full card mode ──
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <BellRing className="size-5 text-emerald-600 dark:text-emerald-400" />
          ) : permission === 'denied' ? (
            <BellOff className="size-5 text-destructive" />
          ) : (
            <Bell className="size-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {t('notifications.pushEnabled') || 'Push Notifications'}
            </p>
            <p className="text-xs text-muted-foreground">
              {permission === 'granted' && tokenRegistered && (t('notifications.pushEnabled') || 'Enabled')}
              {permission === 'granted' && !tokenRegistered && 'Registering...'}
              {permission === 'denied' && (t('notifications.pushBlocked') || 'Blocked')}
              {permission === 'default' && (t('notifications.pushDisabled') || 'Not enabled')}
            </p>
          </div>
        </div>

        {permission === 'granted' && tokenRegistered && (
          <Badge variant="default" className="text-xs">
            {t('notifications.pushEnabled') || 'Active'}
          </Badge>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {permission !== 'granted' && permission !== 'denied' && (
        <Button
          onClick={requestPermission}
          disabled={loading}
          className="w-full gap-2"
          size="sm"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Bell className="size-4" />
          )}
          {t('notifications.enablePush') || 'Enable Push Notifications'}
        </Button>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-muted-foreground">
          Push notifications are blocked. Please enable them in your browser settings.
        </p>
      )}
    </div>
  );
}
