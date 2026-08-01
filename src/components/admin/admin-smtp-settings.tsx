'use client';
import { useState, useEffect } from 'react';
import { Mail, Save, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';

interface SmtpFormData {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_name: string;
  smtp_from_email: string;
}

const DEFAULT_SMTP: SmtpFormData = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_secure: 'false',
  smtp_user: '',
  smtp_pass: '',
  smtp_from_name: 'Carsai Mozambique',
  smtp_from_email: 'noreply@carsaimz.vercel.app',
};

export function AdminSmtpSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [formData, setFormData] = useState<SmtpFormData>(DEFAULT_SMTP);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch('/api/settings');
        const data = await safeJson(res);
        if (!data) return;
        if (data.success && data.data?.map) {
          const map = data.data.map;
          setFormData({
            smtp_host: map.smtp_host || 'smtp.gmail.com',
            smtp_port: map.smtp_port || '587',
            smtp_secure: map.smtp_secure || 'false',
            smtp_user: map.smtp_user || '',
            smtp_pass: map.smtp_pass || '',
            smtp_from_name: map.smtp_from_name || 'Carsai Mozambique',
            smtp_from_email: map.smtp_from_email || 'noreply@carsaimz.vercel.app',
          });
        }
      } catch (err) {
        console.error('SMTP settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(formData).map(([key, value]) => ({ key, value }));

      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray }),
      });
      const data = await safeJson(res);
      if (!data) { toast({ title: t('admin.error'), variant: 'destructive' }); return; }
      if (data.success) {
        toast({ title: t('admin.settingsSaved'), description: 'SMTP configuration saved to database' });
      } else {
        toast({ title: t('admin.error'), description: data.message || 'Save failed', variant: 'destructive' });
      }
    } catch (err) {
      console.error('SMTP settings save error:', err);
      toast({ title: t('admin.error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await apiFetch('/api/settings/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await safeJson(res);
      if (data && data.success) {
        setVerifyResult({ success: true });
      } else {
        setVerifyResult({ success: false, error: data?.error || 'Verification failed' });
      }
    } catch (err) {
      setVerifyResult({ success: false, error: 'Network error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const isConfigured = !!(formData.smtp_user && formData.smtp_pass);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-red-600" />
          <CardTitle>{t('admin.smtpSettings') || 'SMTP Configuration'}</CardTitle>
        </div>
        <CardDescription>
          {t('admin.smtpSettingsDesc') || 'Configure email sending via SMTP. Settings are stored in the database and take priority over environment variables.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={isConfigured ? 'default' : 'secondary'} className={isConfigured ? 'bg-emerald-600' : ''}>
            {isConfigured ? (t('admin.smtpConfigured') || 'Configured') : (t('admin.smtpNotConfigured') || 'Not Configured')}
          </Badge>
          {verifyResult && (
            <Badge variant={verifyResult.success ? 'default' : 'destructive'} className="flex items-center gap-1">
              {verifyResult.success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {verifyResult.success ? 'Connected' : 'Failed'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">{t('admin.smtpHost') || 'SMTP Host'}</Label>
            <Input id="smtp_host" value={formData.smtp_host} onChange={handleChange} placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_port">{t('admin.smtpPort') || 'SMTP Port'}</Label>
            <Input id="smtp_port" value={formData.smtp_port} onChange={handleChange} placeholder="587" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_user">{t('admin.smtpUser') || 'SMTP User (Email)'}</Label>
            <Input id="smtp_user" type="email" value={formData.smtp_user} onChange={handleChange} placeholder="your@gmail.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_pass">{t('admin.smtpPass') || 'SMTP Password / App Password'}</Label>
            <div className="relative">
              <Input
                id="smtp_pass"
                type={showPassword ? 'text' : 'password'}
                value={formData.smtp_pass}
                onChange={handleChange}
                placeholder="App password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_from_name">{t('admin.smtpFromName') || 'From Name'}</Label>
            <Input id="smtp_from_name" value={formData.smtp_from_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_from_email">{t('admin.smtpFromEmail') || 'From Email'}</Label>
            <Input id="smtp_from_email" type="email" value={formData.smtp_from_email} onChange={handleChange} />
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">{t('admin.smtpNote') || 'Note for Gmail:'}</p>
          <p>{t('admin.smtpNoteDesc') || 'Enable 2FA on your Google account, then generate an App Password at myaccount.google.com/apppasswords. Use the 16-character app password here.'}</p>
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t('admin.save')}
          </Button>
          {isConfigured && (
            <Button
              variant="outline"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {t('admin.verifyConnection') || 'Verify Connection'}
            </Button>
          )}
        </div>

        {verifyResult && !verifyResult.success && verifyResult.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {verifyResult.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
