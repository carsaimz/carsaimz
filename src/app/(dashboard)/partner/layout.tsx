'use client';

import { PartnerShell } from '@/components/layout/partner-shell';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerShell>{children}</PartnerShell>;
}
