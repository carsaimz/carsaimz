'use client';
import { UserLoyalty } from '@/components/user/user-loyalty';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function UserLoyaltyPage() {
  useDocumentTitle('loyalty.title', 'Fidelidade');
  return <UserLoyalty />;
}
