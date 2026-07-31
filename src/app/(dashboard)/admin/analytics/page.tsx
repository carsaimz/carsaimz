'use client';
import { AdminAnalytics } from '@/components/admin/admin-analytics';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function AdminAnalyticsPage() {
  useDocumentTitle('admin.systemLogs', 'Analytics');
  return <AdminAnalytics />;
}
