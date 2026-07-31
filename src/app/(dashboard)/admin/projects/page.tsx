'use client';
import { AdminContentManager } from '@/components/admin/admin-content-manager';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AdminProjectsPage() {
  useDocumentTitle('admin.projects', 'Projectos');
  return <AdminContentManager contentType="projects" />;
}
