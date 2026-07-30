'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { type LanguageCode, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n';
import { LanguageTabs } from '@/components/common/language-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  Send, Bell, Search, Users, Mail, Smartphone, Globe,
} from 'lucide-react';

// ============================================================================
// Animation
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ============================================================================
// Types
// ============================================================================

interface UserOption {
  id: string;
  name: string;
  email: string;
}

// ============================================================================
// Component
// ============================================================================

export function AdminNotificationSender() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [targetType, setTargetType] = useState<'all' | 'user'>('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formLink, setFormLink] = useState('');
  const [channelWeb, setChannelWeb] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [channelPush, setChannelPush] = useState(true);
  const [sending, setSending] = useState(false);

  // i18n form state
  const [formTitleI18n, setFormTitleI18n] = useState<Record<string, string>>({});
  const [formMessageI18n, setFormMessageI18n] = useState<Record<string, string>>({});

  const i18nLangs = AVAILABLE_LANGUAGES.filter((code) => code !== DEFAULT_LANGUAGE);

  const setI18nValue = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    lang: LanguageCode,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [lang]: value }));
  };

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiFetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=20`);
      const data = await safeJson(res);
      if (data && data.success) {
        setSearchResults(
          (data.users || data.data || []).map((u: any) => ({
            id: u.id,
            name: u.name || '',
            email: u.email || '',
          }))
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Send notification
  const handleSend = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast({
        title: t('admin.error'),
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'user' && !selectedUserId) {
      toast({
        title: t('admin.error'),
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      // Build i18n title/message
      const titleI18nObj: Record<string, string> = {};
      const messageI18nObj: Record<string, string> = {};
      for (const lang of i18nLangs) {
        if (formTitleI18n[lang]?.trim()) titleI18nObj[lang] = formTitleI18n[lang];
        if (formMessageI18n[lang]?.trim()) messageI18nObj[lang] = formMessageI18n[lang];
      }

      const finalTitle = Object.keys(titleI18nObj).length > 0
        ? JSON.stringify({ default: formTitle, ...titleI18nObj })
        : formTitle;
      const finalMessage = Object.keys(messageI18nObj).length > 0
        ? JSON.stringify({ default: formMessage, ...messageI18nObj })
        : formMessage;

      const channels = {
        web: channelWeb,
        email: channelEmail,
        push: channelPush,
      };

      if (targetType === 'all') {
        // Fetch all users and send to each
        const res = await apiFetch('/api/admin/users?limit=1000');
        const data = await safeJson(res);
        if (!data || !data.success) {
          toast({
            title: t('admin.error'),
            description: 'Failed to fetch users',
            variant: 'destructive',
          });
          setSending(false);
          return;
        }
        const users = data.users || data.data || [];
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
          try {
            const notifRes = await apiFetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                type: notificationType,
                title: finalTitle,
                message: finalMessage,
                link: formLink || null,
                channels,
              }),
            });
            const notifData = await safeJson(notifRes);
            if (notifData && notifData.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }

        toast({
          title: t('admin.notificationSent'),
          description: `Sent to ${successCount} users${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        });
      } else {
        // Send to specific user
        const res = await apiFetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            type: notificationType,
            title: finalTitle,
            message: finalMessage,
            link: formLink || null,
            channels,
          }),
        });
        const data = await safeJson(res);
        if (data && data.success) {
          toast({
            title: t('admin.notificationSent'),
            description: t('admin.notificationSent'),
          });
        } else {
          toast({
            title: t('admin.error'),
            description: t('admin.notificationSendFailed'),
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({
        title: t('admin.error'),
        description: t('admin.notificationSendFailed'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Notification type colors
  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-600" />
            {t('admin.sendNotification')}
          </h2>
        </div>
      </motion.div>

      {/* Notification Form */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-emerald-600" />
              {t('admin.sendNotification')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target User */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('admin.notificationTarget')}</Label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as 'all' | 'user')}>
                <SelectTrigger className="w-full focus-visible:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      {t('admin.notificationAllUsers')}
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Search className="size-4" />
                      {t('admin.notificationSearchUsers')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {targetType === 'user' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('admin.notificationSearchUsers')}
                      className="pl-10 focus-visible:ring-emerald-500"
                    />
                  </div>
                  {searching && (
                    <p className="text-xs text-muted-foreground">Searching...</p>
                  )}
                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between ${
                            selectedUserId === user.id ? 'bg-accent' : ''
                          }`}
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setSearchQuery(user.name || user.email);
                            setSearchResults([]);
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">{user.name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          {selectedUserId === user.id && (
                            <Badge variant="default" className="bg-emerald-600 text-white text-xs">Selected</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.notificationType')}</Label>
              <div className="flex flex-wrap gap-2">
                {(['info', 'success', 'warning', 'error'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNotificationType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      notificationType === type
                        ? typeColors[type]
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title with i18n */}
            <LanguageTabs
              defaultLanguageFields={
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('admin.notificationTitle')}</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Notification title"
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
              }
              i18nLanguageFields={Object.fromEntries(
                i18nLangs.map((lang) => [
                  lang,
                  <div className="space-y-2" key={lang}>
                    <Label className="text-sm font-medium">{t('admin.notificationTitle')} ({lang})</Label>
                    <Input
                      value={formTitleI18n[lang] || ''}
                      onChange={(e) => setI18nValue(setFormTitleI18n, lang, e.target.value)}
                      placeholder={`Title in ${lang}`}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>,
                ])
              )}
            />

            {/* Message with i18n */}
            <LanguageTabs
              defaultLanguageFields={
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('admin.notificationMessage')}</Label>
                  <Textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={4}
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
              }
              i18nLanguageFields={Object.fromEntries(
                i18nLangs.map((lang) => [
                  lang,
                  <div className="space-y-2" key={lang}>
                    <Label className="text-sm font-medium">{t('admin.notificationMessage')} ({lang})</Label>
                    <Textarea
                      value={formMessageI18n[lang] || ''}
                      onChange={(e) => setI18nValue(setFormMessageI18n, lang, e.target.value)}
                      placeholder={`Message in ${lang}`}
                      rows={4}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>,
                ])
              )}
            />

            {/* Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.notificationLink')}</Label>
              <Input
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://example.com/page"
                className="focus-visible:ring-emerald-500"
              />
            </div>

            {/* Channels */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('admin.notificationChannels')}</Label>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={channelWeb} onCheckedChange={setChannelWeb} />
                  <Label className="text-sm flex items-center gap-1.5">
                    <Globe className="size-4 text-muted-foreground" />
                    Web
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={channelEmail} onCheckedChange={setChannelEmail} />
                  <Label className="text-sm flex items-center gap-1.5">
                    <Mail className="size-4 text-muted-foreground" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={channelPush} onCheckedChange={setChannelPush} />
                  <Label className="text-sm flex items-center gap-1.5">
                    <Smartphone className="size-4 text-muted-foreground" />
                    Push
                  </Label>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                onClick={handleSend}
                disabled={sending || !formTitle.trim() || !formMessage.trim()}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="size-4" />
                    {t('admin.notificationSend')}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
