'use client';
import { PartnerCommissions } from '@/components/partner/partner-commissions';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function PartnerCommissionsPage() {
  useDocumentTitle('partner.commissions', 'Comissões');
  return <PartnerCommissions />;
}
