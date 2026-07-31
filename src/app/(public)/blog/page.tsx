'use client';
import { BlogPage } from '@/components/blog/blog-page';
import { useDocumentTitle } from '@/hooks/use-document-title';
export default function BlogPageRoute() {
  useDocumentTitle('nav.blog', 'Blog');
  return <BlogPage />;
}
