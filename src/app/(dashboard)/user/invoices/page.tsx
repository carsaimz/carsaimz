'use client';
import { UserInvoices } from '@/components/user/user-invoices';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserInvoicesPage() {
  useDocumentTitle('dashboard.invoices', 'Facturas');
  return <UserInvoices />;
}
