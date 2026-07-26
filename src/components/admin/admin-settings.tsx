'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function AdminSettings() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    siteName: 'Carsai Moçambique',
    siteEmail: 'admin@carsai.mz',
    sitePhone: '+258 21 000 000',
    maintenanceMode: false,
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData(prev => ({ ...prev, [e.target.id]: e.target.value })); };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-emerald-600" />{t('admin.systemSettings') || 'System Settings'}</h2>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="siteName">Site Name</Label><Input id="siteName" value={formData.siteName} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
              <div className="space-y-2"><Label htmlFor="siteEmail">Admin Email</Label><Input id="siteEmail" type="email" value={formData.siteEmail} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
              <div className="space-y-2"><Label htmlFor="sitePhone">Contact Phone</Label><Input id="sitePhone" value={formData.sitePhone} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
              {saved && <span className="text-sm text-emerald-600 font-medium">✓ Settings saved!</span>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
