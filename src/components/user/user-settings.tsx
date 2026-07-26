'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, User, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function UserSettings() {
  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    bio: user?.bio || '',
    address: user?.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = () => {
    // Simulated save - in production would call API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-emerald-600" />{t('dashboard.settings') || 'Settings'}</h2>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-emerald-600" />Profile Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="name">{t('auth.fullName')}</Label><Input id="name" value={formData.name} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
              <div className="space-y-2"><Label htmlFor="email">{t('auth.email')}</Label><Input id="email" type="email" value={formData.email} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
              <div className="space-y-2"><Label htmlFor="phone"><Phone className="h-3.5 w-3.5 mr-1 inline" />Phone</Label><Input id="phone" value={formData.phone} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
              <div className="space-y-2"><Label htmlFor="company"><Building2 className="h-3.5 w-3.5 mr-1 inline" />Company</Label><Input id="company" value={formData.company} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" value={formData.bio} onChange={handleChange} className="focus-visible:ring-emerald-500 resize-none" rows={3} /></div>
            <div className="space-y-2"><Label htmlFor="address"><MapPin className="h-3.5 w-3.5 mr-1 inline" />Address</Label><Input id="address" value={formData.address} onChange={handleChange} className="focus-visible:ring-emerald-500" /></div>

            <Separator />

            <div className="flex items-center gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />Save Changes
              </Button>
              {saved && <span className="text-sm text-emerald-600 font-medium">✓ Saved successfully!</span>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
