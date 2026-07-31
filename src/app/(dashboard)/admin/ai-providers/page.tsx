'use client';

import { AdminAiProviders } from '@/components/admin/admin-ai-providers';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function AiProvidersPage() {
  useDocumentTitle('admin.aiProviders', 'Provedores IA');
  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminAiProviders />
    </div>
  );
}
