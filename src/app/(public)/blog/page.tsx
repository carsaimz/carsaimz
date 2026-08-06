'use client';
import { BlogPage } from '@/components/blog/blog-page';
import { AdPlacement } from '@/components/common/ad-renderer';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function BlogPageRoute() {
  useDocumentTitle('nav.blog', 'Blog');
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <BlogPage />
          </div>
          <aside className="hidden lg:block w-[300px] shrink-0">
            <AdPlacement placement="blog_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
