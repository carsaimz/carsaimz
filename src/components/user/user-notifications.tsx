'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Mail,
  MailOpen,
  Smartphone,
  Monitor,
  Settings2,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

// ── Animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Types ──
interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  channels?: { web?: boolean; email?: boolean; push?: boolean };
  createdAt: string;
}

interface NotificationPreferences {
  channels: {
    web: boolean;
    email: boolean;
    push: boolean;
  };
}

// ── Notification type icon & color ──
function getNotifIcon(type: string) {
  switch (type) {
    case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
    default: return <Info className="h-5 w-5 text-blue-600" />;
  }
}

function getNotifBg(type: string, isRead: boolean) {
  if (isRead) return 'bg-muted/30';
  switch (type) {
    case 'success': return 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500';
    case 'warning': return 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500';
    case 'error': return 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500';
    default: return 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500';
  }
}

const PAGE_SIZE = 20;

export function UserNotifications() {
  const { t, languageConfig } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Preferences
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    channels: { web: true, email: false, push: true },
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async (pageNum = 0, append = false) => {
    if (!user?.id) return;

    try {
      setLoading(!append);
      setError(null);

      const params = new URLSearchParams({
        userId: user.id,
        limit: String(PAGE_SIZE),
        offset: String(pageNum * PAGE_SIZE),
      });

      if (filter === 'unread') {
        params.set('unreadOnly', 'true');
      } else if (filter !== 'all') {
        params.set('type', filter);
      }

      const res = await apiFetch(`/api/notifications?${params}`);
      const data = await safeJson(res);

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to load notifications');
      }

      const newNotifs = data.notifications || [];
      setNotifications(prev => append ? [...prev, ...newNotifs] : newNotifs);
      setUnreadCount(data.unreadCount || 0);
      setHasMore(newNotifs.length >= PAGE_SIZE);

      // Load preferences
      if (data.preferences?.channels) {
        setPrefs({ channels: data.preferences.channels });
      }
    } catch (err: any) {
      setError(err.message || t('notifications.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, t]);

  useEffect(() => {
    setPage(0);
    fetchNotifications(0, false);
  }, [filter, user?.id]);

  // ── Mark as read ──
  const markAsRead = async (notifId: string) => {
    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markRead',
          userId: user?.id,
          notificationId: notifId,
        }),
      });

      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // ── Mark all as read ──
  const markAllAsRead = async () => {
    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAllRead',
          userId: user?.id,
        }),
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // ── Delete notification ──
  const deleteNotification = async (notifId: string) => {
    try {
      await apiFetch(`/api/notifications?id=${notifId}`, {
        method: 'DELETE',
      });

      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === notifId);
        return notif?.isRead ? prev : Math.max(0, prev - 1);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // ── Update preferences ──
  const updatePreferences = async (newChannels: NotificationPreferences['channels']) => {
    try {
      setSavingPrefs(true);
      await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePreferences',
          userId: user?.id,
          channels: newChannels,
        }),
      });

      setPrefs({ channels: newChannels });
    } catch (err) {
      console.error('Failed to update preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Format date ──
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return t('notifications.justNow');
      if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
      if (hours < 24) return t('notifications.hoursAgo', { count: hours });
      if (days < 7) return t('notifications.daysAgo', { count: days });
      return date.toLocaleDateString(languageConfig.locale, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ── Loading skeletons ──
  if (loading && notifications.length === 0) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </motion.div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">{t('notifications.loadError')}</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => fetchNotifications(0, false)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('notifications.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? unreadCount === 1
                ? t('notifications.unreadCount', { count: unreadCount })
                : t('notifications.unreadCountPlural', { count: unreadCount })
              : t('notifications.allRead')
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(0, false)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Tabs: Notifications + Preferences ── */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-4 w-4" />
            {t('notifications.title')}
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-1.5 py-0">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1">
            <Settings2 className="h-4 w-4" />
            {t('notifications.preferences')}
          </TabsTrigger>
        </TabsList>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications" className="space-y-4">
          {/* ── Filter bar ── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {[
                { key: 'all', label: t('notifications.all') },
                { key: 'unread', label: t('notifications.unread') },
                { key: 'info', label: t('notifications.info') },
                { key: 'success', label: t('notifications.success') },
                { key: 'warning', label: t('notifications.warning') },
                { key: 'error', label: t('notifications.error') },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'outline'}
                  size="sm"
                  className={filter === key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => setFilter(key as any)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* ── Notification list ── */}
          {notifications.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-12 text-center">
                  <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg">{t('notifications.noNotifications')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filter === 'all'
                      ? t('notifications.noNotificationsDesc')
                      : t('notifications.noNotificationsFiltered')
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} className="space-y-2">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  variants={itemVariants}
                  className={`rounded-xl p-4 transition-all hover:shadow-sm ${getNotifBg(notif.type, notif.isRead)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                      {getNotifIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`text-sm font-semibold ${notif.isRead ? 'text-muted-foreground' : ''}`}>
                            {notif.title}
                          </h4>
                          <p className={`text-sm mt-0.5 ${notif.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notif.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Channel badges */}
                          <div className="flex items-center gap-1 mr-1">
                            {notif.channels?.web && (
                              <Monitor className="h-3 w-3 text-muted-foreground" />
                            )}
                            {notif.channels?.email && (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            )}
                            {notif.channels?.push && (
                              <Smartphone className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {/* Time */}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        {notif.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 dark:text-emerald-400 h-7 text-xs"
                            onClick={() => {
                              if (!notif.isRead) markAsRead(notif.id);
                              window.location.href = notif.link!;
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t('notifications.viewDetails')}
                          </Button>
                        )}
                        {!notif.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => markAsRead(notif.id)}
                          >
                            <MailOpen className="h-3 w-3 mr-1" />
                            {t('notifications.markAsRead')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-500 hover:text-red-700"
                          onClick={() => deleteNotification(notif.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Pagination ── */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchNotifications(newPage, false);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('notifications.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('notifications.page')} {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchNotifications(newPage, true);
                }}
              >
                {t('notifications.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── Preferences Tab ── */}
        <TabsContent value="preferences">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('notifications.preferencesTitle')}
                </CardTitle>
                <CardDescription>
                  {t('notifications.preferencesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Web notifications ── */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">{t('notifications.webNotifications')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('notifications.webNotificationsDesc')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={prefs.channels.web}
                    onCheckedChange={(checked) =>
                      updatePreferences({ ...prefs.channels, web: checked })
                    }
                    disabled={savingPrefs}
                  />
                </div>

                {/* ── Email notifications ── */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">{t('notifications.emailNotifications')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('notifications.emailNotificationsDesc')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={prefs.channels.email}
                    onCheckedChange={(checked) =>
                      updatePreferences({ ...prefs.channels, email: checked })
                    }
                    disabled={savingPrefs}
                  />
                </div>

                {/* ── Push notifications ── */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">{t('notifications.pushNotifications')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('notifications.pushNotificationsDesc')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={prefs.channels.push}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        // Request browser permission for push notifications
                        const permission = await Notification.requestPermission()
                        if (permission !== 'granted') {
                          return // Don't enable if user denies
                        }

                        // Register FCM token
                        try {
                          const { requestFCMToken } = await import('@/lib/firebase-client')
                          const token = await requestFCMToken()
                          if (token && user?.id) {
                            await apiFetch('/api/fcm', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ uid: user.id, token }),
                            })
                          }
                        } catch (err) {
                          console.warn('FCM token registration failed:', err)
                        }
                      }
                      updatePreferences({ ...prefs.channels, push: checked })
                    }}
                    disabled={savingPrefs}
                  />
                </div>

                <Separator />

                {/* ── Summary ── */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t('notifications.preferencesSummary')}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                    <p>
                      <Monitor className="h-3 w-3 inline mr-1" />
                      Web: {prefs.channels.web ? `✓ ${t('notifications.enabled')}` : `✗ ${t('notifications.disabled')}`}
                    </p>
                    <p>
                      <Mail className="h-3 w-3 inline mr-1" />
                      Email: {prefs.channels.email ? `✓ ${t('notifications.enabled')}` : `✗ ${t('notifications.disabled')}`}
                    </p>
                    <p>
                      <Smartphone className="h-3 w-3 inline mr-1" />
                      Push: {prefs.channels.push ? `✓ ${t('notifications.enabled')}` : `✗ ${t('notifications.disabled')}`}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    {t('notifications.autoSaveDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
