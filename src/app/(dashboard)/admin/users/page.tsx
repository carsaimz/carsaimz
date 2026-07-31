'use client';
import { AdminUsers } from '@/components/admin/admin-users';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function AdminUsersPage() {
  useDocumentTitle('admin.users', 'Utilizadores');
  return <AdminUsers />;
}
