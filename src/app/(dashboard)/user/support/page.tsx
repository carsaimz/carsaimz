'use client';
import { UserSupport } from '@/components/user/user-support';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserSupportPage() {
  useDocumentTitle('dashboard.support', 'Suporte');
  return <UserSupport />;
}
