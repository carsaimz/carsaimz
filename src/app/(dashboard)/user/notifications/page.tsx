'use client';
import { UserNotifications } from '@/components/user/user-notifications';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function NotificationsPage() {
  useDocumentTitle('dashboard.notifications', 'Notificações');
  return <UserNotifications />;
}
