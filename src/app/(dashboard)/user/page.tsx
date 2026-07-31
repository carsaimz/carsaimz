'use client';
import { UserDashboard } from '@/components/user/user-dashboard';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserPage() {
  useDocumentTitle('dashboard.profile', 'Perfil');
  return <UserDashboard />;
}
