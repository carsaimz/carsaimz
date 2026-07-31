'use client';
import { UserSettings } from '@/components/user/user-settings';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserSettingsPage() {
  useDocumentTitle('dashboard.settings', 'Configurações');
  return <UserSettings />;
}
