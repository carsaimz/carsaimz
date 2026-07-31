'use client';
import { UserQuotes } from '@/components/user/user-quotes';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserQuotesPage() {
  useDocumentTitle('dashboard.quotes', 'Cotações');
  return <UserQuotes />;
}
