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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  Send, Bell, Search, Users, Mail, Smartphone, Globe,
  CheckSquare, Square, Filter, ChevronDown, ChevronUp,
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
  role: string;
}

// ============================================================================
// Component
// ============================================================================

export function AdminNotificationSender() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
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

  // User list state
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showUserList, setShowUserList] = useState(true);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await apiFetch('/api/admin/users?limit=1000');
      const data = await safeJson(res);
      if (data && data.success) {
        const users = data.users || data.data || [];
        setAllUsers(
          users.map((u: any) => ({
            id: u.id,
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'user',
          }))
        );
      }
    } catch {
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = !searchFilter ||
      u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Selection helpers
  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.id);
    const allVisibleSelected = visibleIds.every((id) => selectedUserIds.has(id));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedUserIds(new Set(allUsers.map((u) => u.id)));
  };

  const deselectAll = () => {
    setSelectedUserIds(new Set());
  };

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

    if (targetType === 'selected' && selectedUserIds.size === 0) {
      toast({
        title: t('admin.error'),
        description: 'Please select at least one user',
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

      // Determine target users
      const targetUsers = targetType === 'all'
        ? allUsers
        : allUsers.filter((u) => selectedUserIds.has(u.id));

      let successCount = 0;
      let failCount = 0;

      for (const user of targetUsers) {
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

  // Role badge colors
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    partner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    user: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const targetCount = targetType === 'all' ? allUsers.length : selectedUserIds.size;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.sendNotification')}
          </h2>
        </div>
      </motion.div>

      {/* Notification Form */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {t('admin.sendNotification')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('admin.notificationTarget')}</Label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as 'all' | 'selected')}>
                <SelectTrigger className="w-full focus-visible:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      {t('admin.notificationAllUsers')} ({allUsers.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="selected">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="size-4" />
                      {t('admin.notificationSelectedUsers') || 'Selected Users'} ({selectedUserIds.size})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User List (when "selected" is chosen) */}
            {targetType === 'selected' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {t('admin.selectUsers') || 'Select Users'} — {selectedUserIds.size} selected
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7 text-xs"
                    onClick={() => setShowUserList(!showUserList)}
                  >
                    {showUserList ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    {showUserList ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showUserList && (
                  <>
                    {/* Search & Filter Bar */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder={t('admin.notificationSearchUsers') || 'Search users...'}
                          className="pl-10 focus-visible:ring-emerald-500"
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={selectAll} className="gap-1 h-8 text-xs">
                        <CheckSquare className="size-3.5" />
                        All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll} className="gap-1 h-8 text-xs">
                        <Square className="size-3.5" />
                        None
                      </Button>
                    </div>

                    {/* User Table */}
                    <Card>
                      <CardContent className="p-0">
                        {usersLoading ? (
                          <div className="p-4 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Skeleton key={i} className="h-8 w-full" />
                            ))}
                          </div>
                        ) : (
                          <div className="max-h-[400px] overflow-y-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                  <TableHead className="w-10">
                                    <input
                                      type="checkbox"
                                      checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id))}
                                      onChange={toggleAllVisible}
                                      className="rounded border-border"
                                    />
                                  </TableHead>
                                  <TableHead>{t('admin.name') || 'Name'}</TableHead>
                                  <TableHead className="hidden sm:table-cell">{t('auth.email') || 'Email'}</TableHead>
                                  <TableHead>{t('admin.role') || 'Role'}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredUsers.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                      {searchFilter || roleFilter !== 'all' ? 'No users match the filter' : 'No users found'}
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredUsers.map((user) => (
                                    <TableRow
                                      key={user.id}
                                      className={selectedUserIds.has(user.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}
                                    >
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={selectedUserIds.has(user.id)}
                                          onChange={() => toggleUser(user.id)}
                                          className="rounded border-border"
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium text-sm truncate max-w-[180px]">
                                        {user.name || '—'}
                                      </TableCell>
                                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[200px]">
                                        {user.email}
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={`text-[10px] ${roleColors[user.role] || roleColors.user}`}>
                                          {user.role}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground">
                      Showing {filteredUsers.length} of {allUsers.length} users — {selectedUserIds.size} selected
                    </p>
                  </>
                )}
              </div>
            )}

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
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {t('admin.willSendTo') || 'Will send to'}: <strong>{targetCount}</strong> {t('admin.usersCount') || 'users'}
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                onClick={handleSend}
                disabled={sending || !formTitle.trim() || !formMessage.trim() || (targetType === 'selected' && selectedUserIds.size === 0)}
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
