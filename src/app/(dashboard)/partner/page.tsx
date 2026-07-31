'use client';
import { PartnerDashboard } from '@/components/partner/partner-dashboard';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function PartnerPage() {
  useDocumentTitle('partner.portfolio', 'Parceiro');
  return <PartnerDashboard />;
}
