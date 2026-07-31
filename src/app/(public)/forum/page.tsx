'use client';
import { ForumPage } from '@/components/forum/forum-page';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function ForumPageRoute() {
  useDocumentTitle('nav.forum', 'Fórum');
  return <ForumPage />;
}
