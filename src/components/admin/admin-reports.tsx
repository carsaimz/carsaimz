'use client';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function AdminReports() {
  const { t } = useLanguage();
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-emerald-600" />{t('admin.reports') || 'Reports'}</h2>
        <p className="text-muted-foreground mt-1">Platform reports and analytics overview</p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <AdminDashboard />
      </motion.div>
    </motion.div>
  );
}
