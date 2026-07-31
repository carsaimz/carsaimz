'use client';
import { UserPayments } from '@/components/user/user-payments';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserPaymentsPage() {
  useDocumentTitle('dashboard.payments', 'Pagamentos');
  return <UserPayments />;
}
