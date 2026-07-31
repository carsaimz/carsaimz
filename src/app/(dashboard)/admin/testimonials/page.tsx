'use client';
import { AdminContentManager } from '@/components/admin/admin-content-manager';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AdminTestimonialsPage() {
  useDocumentTitle('admin.testimonials', 'Testemunhos');
  return <AdminContentManager contentType="testimonials" />;
}
