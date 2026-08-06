'use client';
import { ForumPage } from '@/components/forum/forum-page';
import { AdPlacement } from '@/components/common/ad-renderer';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function ForumPageRoute() {
  useDocumentTitle('nav.forum', 'Fórum');
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <ForumPage />
          </div>
          <aside className="hidden lg:block w-[300px] shrink-0">
            <AdPlacement placement="forum_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
