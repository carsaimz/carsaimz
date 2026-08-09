'use client';
import { AdminContentManager } from '@/components/admin/admin-content-manager';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AdminServiceReviewsPage() {
  useDocumentTitle('admin.serviceReviews', 'Avaliações de Serviços');
  return <AdminContentManager contentType="service_reviews" />;
}
