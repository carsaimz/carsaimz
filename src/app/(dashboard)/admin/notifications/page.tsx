'use client';

import { AdminNotificationSender } from '@/components/admin/admin-notification-sender';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AdminNotificationsPage() {
  useDocumentTitle('admin.sendNotification', 'Notificações');
  return <AdminNotificationSender />;
}
