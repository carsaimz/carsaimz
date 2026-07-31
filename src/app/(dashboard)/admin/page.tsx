'use client';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function AdminPage() {
  useDocumentTitle('admin.dashboard', 'Administração');
  return <AdminDashboard />;
}
