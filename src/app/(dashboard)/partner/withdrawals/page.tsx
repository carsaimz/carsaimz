'use client';
import { PartnerWithdrawals } from '@/components/partner/partner-withdrawals';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function PartnerWithdrawalsPage() {
  useDocumentTitle('partner.withdrawals', 'Levantamentos');
  return <PartnerWithdrawals />;
}
