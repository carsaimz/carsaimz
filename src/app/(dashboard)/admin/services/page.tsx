'use client';
import { AdminContentManager } from '@/components/admin/admin-content-manager';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AdminServicesPage() {
  useDocumentTitle('admin.services', 'Serviços');
  return <AdminContentManager contentType="services" />;
}
