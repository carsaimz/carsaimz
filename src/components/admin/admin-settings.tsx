'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, Bot, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { AdminAiProviders } from '@/components/admin/admin-ai-providers';
import { AdminPaymentProviders } from '@/components/admin/admin-payment-providers';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    siteName: 'Carsai Mozambique',
    siteEmail: 'carsaimozambique@gmail.com',
    sitePhone: '847545020',
    maintenanceMode: false,
  });

  // Load settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch('/api/settings');
        const data = await safeJson(res);
        if (!data) return;
        if (data.success && data.data?.map) {
          const map = data.data.map;
          setFormData({
            siteName: map.siteName || 'Carsai Mozambique',
            siteEmail: map.siteEmail || 'carsaimozambique@gmail.com',
            sitePhone: map.sitePhone || '847545020',
            maintenanceMode: map.maintenanceMode === 'true',
          });
        }
      } catch (err) {
        console.error('Settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert formData object to array format expected by the API
      const settingsArray = [
        { key: 'siteName', value: formData.siteName },
        { key: 'siteEmail', value: formData.siteEmail },
        { key: 'sitePhone', value: formData.sitePhone },
        { key: 'maintenanceMode', value: String(formData.maintenanceMode) },
      ];

      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray }),
      });
      const data = await safeJson(res);
      if (!data) { toast({ title: t('admin.error'), description: t('common.serverNonJson'), variant: 'destructive' }); return; }
      if (data.success) {
        // Set maintenance mode cookie for middleware to read
        const maintenanceValue = String(formData.maintenanceMode);
        document.cookie = `carsai-maintenance=${maintenanceValue};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;

        toast({ title: t('admin.settingsSaved'), description: t('admin.settingsSavedDesc') });
      } else {
        toast({ title: t('admin.error'), description: data.message || t('admin.settingsSaveFailed'), variant: 'destructive' });
      }
    } catch (err) {
      console.error('Settings save error:', err);
      toast({ title: t('admin.error'), description: t('admin.settingsSaveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-red-600" />
          {t('admin.systemSettings')}
        </h2>
      </motion.div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="gap-1">
            <Settings className="size-4" />
            {t('admin.general')}
          </TabsTrigger>
          <TabsTrigger value="ai-providers" className="gap-1">
            <Bot className="size-4" />
            {t('admin.aiProviders')}
          </TabsTrigger>
          <TabsTrigger value="payment-providers" className="gap-1">
            <CreditCard className="size-4" />
            {t('payment.providers') || 'Payment Providers'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader><CardTitle>{t('admin.generalSettings')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">{t('admin.siteName')}</Label>
                    <Input id="siteName" value={formData.siteName} onChange={handleChange} className="focus-visible:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteEmail">{t('admin.siteEmail')}</Label>
                    <Input id="siteEmail" type="email" value={formData.siteEmail} onChange={handleChange} className="focus-visible:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sitePhone">{t('admin.sitePhone')}</Label>
                    <Input id="sitePhone" value={formData.sitePhone} onChange={handleChange} className="focus-visible:ring-red-500" />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                  <Label className="text-sm">{t('admin.maintenanceMode')}</Label>
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
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ai-providers">
          <AdminAiProviders />
        </TabsContent>

        <TabsContent value="payment-providers">
          <AdminPaymentProviders />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
