'use client';
import { PartnerAffiliate } from '@/components/partner/partner-affiliate';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function PartnerAffiliatePage() {
  useDocumentTitle('partner.affiliate', 'Afiliado');
  return <PartnerAffiliate />;
}
