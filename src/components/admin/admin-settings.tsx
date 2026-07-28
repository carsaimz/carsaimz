'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { AdminAiProviders } from '@/components/admin/admin-ai-providers';

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
        const res = await fetch('/api/settings');
        const data = await res.json();
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
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            siteName: formData.siteName,
            siteEmail: formData.siteEmail,
            sitePhone: formData.sitePhone,
            maintenanceMode: String(formData.maintenanceMode),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.systemSettings'), description: 'Configurações guardadas!' });
      } else {
        toast({ title: 'Erro', description: data.message || 'Falha ao guardar', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Settings save error:', err);
      toast({ title: 'Erro', description: 'Falha ao guardar', variant: 'destructive' });
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
          {t('admin.systemSettings') || 'Configurações do Sistema'}
        </h2>
      </motion.div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="gap-1">
            <Settings className="size-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="ai-providers" className="gap-1">
            <Bot className="size-4" />
            Provedores de IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader><CardTitle>{t('admin.systemSettings') || 'Configurações Gerais'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">{t('admin.title') || 'Nome do Site'}</Label>
                    <Input id="siteName" value={formData.siteName} onChange={handleChange} className="focus-visible:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteEmail">{t('admin.systemSettings') || 'E-mail Admin'}</Label>
                    <Input id="siteEmail" type="email" value={formData.siteEmail} onChange={handleChange} className="focus-visible:ring-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sitePhone">{t('admin.systemSettings') || 'Telefone'}</Label>
                    <Input id="sitePhone" value={formData.sitePhone} onChange={handleChange} className="focus-visible:ring-red-500" />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                  <Label className="text-sm">Modo de Manutenção</Label>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('admin.save') || 'Guardar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ai-providers">
          <AdminAiProviders />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
