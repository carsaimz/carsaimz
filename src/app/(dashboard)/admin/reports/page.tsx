'use client';
import { AdminReports } from '@/components/admin/admin-reports';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function AdminReportsPage() {
  useDocumentTitle('admin.reports', 'Relatórios');
  return <AdminReports />;
}
