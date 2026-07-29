'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, User, Mail, Phone, MapPin, Building2, FileText, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch } from '@/lib/api-fetch';
import { toast } from 'sonner';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function UserSettings() {
  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    bio: user?.bio || '',
    address: user?.address || '',
  });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setPasswordError('');
    try {
      // Validate password if provided
      if (newPassword) {
        if (newPassword.length < 8) {
          setPasswordError(t('auth.passwordMinLength'));
          setSaving(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPasswordError(t('auth.passwordsDoNotMatch'));
          setSaving(false);
          return;
        }
      }

      // Save profile data
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: formData.name,
          phone: formData.phone,
          company: formData.company,
          bio: formData.bio,
          address: formData.address,
        }),
      });

      const data = await res.json();

      if (data.user) {
        // Update the store with the new user data
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || user?.role || 'user',
          avatar: data.user.avatar || user?.avatar || null,
          phone: data.user.phone || null,
          company: data.user.company || null,
          bio: data.user.bio || null,
          address: data.user.address || null,
        });

        // If password change was requested, update password separately
        if (newPassword) {
          const passRes = await apiFetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id,
              newPassword,
            }),
          });
          const passData = await passRes.json();
          if (!passData.user) {
            toast.error(t('auth.passwordUpdateFailed') || 'Failed to update password');
          }
        }

        toast.success(t('dashboard.profileSaved') || 'Profile saved successfully');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(data.error || t('common.error') || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error(t('common.error') || 'Failed to save profile');
    }
    setSaving(false);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-emerald-600" />{t('dashboard.settings') || 'Settings'}</h2>
        <p className="text-muted-foreground mt-1">{t('dashboard.settingsDesc') || 'Manage your profile and preferences'}</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-emerald-600" />{t('dashboard.profileInfo') || 'Profile Information'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.fullName')}</Label>
                <Input id="name" value={formData.name} onChange={handleChange} className="focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} className="focus-visible:ring-emerald-500 bg-muted/50" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone"><Phone className="h-3.5 w-3.5 mr-1 inline" />{t('auth.phone')}</Label>
                <Input id="phone" value={formData.phone} onChange={handleChange} className="focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company"><Building2 className="h-3.5 w-3.5 mr-1 inline" />{t('dashboard.company') || 'Company'}</Label>
                <Input id="company" value={formData.company} onChange={handleChange} className="focus-visible:ring-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio"><FileText className="h-3.5 w-3.5 mr-1 inline" />{t('dashboard.bio') || 'Bio'}</Label>
              <Textarea id="bio" value={formData.bio} onChange={handleChange} className="focus-visible:ring-emerald-500 resize-none" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address"><MapPin className="h-3.5 w-3.5 mr-1 inline" />{t('dashboard.address') || 'Address'}</Label>
              <Input id="address" value={formData.address} onChange={handleChange} className="focus-visible:ring-emerald-500" />
            </div>

            <Separator />

            {/* Password Change Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">{t('dashboard.changePassword') || 'Change Password'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordMinLength')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="focus-visible:ring-emerald-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.confirmPassword')}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="focus-visible:ring-emerald-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? (t('dashboard.saving') || 'Saving...') : (t('dashboard.saveChanges') || 'Save Changes')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
