'use client';
import { AdminContentManager } from '@/components/admin/admin-content-manager';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AdminBlogPage() {
  useDocumentTitle('admin.posts', 'Blog');
  return <AdminContentManager contentType="posts" />;
}
