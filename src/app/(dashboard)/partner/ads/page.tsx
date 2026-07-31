'use client';

import { PartnerAdsManager } from '@/components/partner/partner-ads-manager';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function PartnerAdsPage() {
  useDocumentTitle('ads.title', 'Anúncios');
  return <PartnerAdsManager />;
}
