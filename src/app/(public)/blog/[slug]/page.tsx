import { PostDetail } from '@/components/blog/post-detail';

// Required for static export: return empty array since all slugs are dynamic
// In Next.js, generateStaticParams must be in a server component file.
export async function generateStaticParams() {
  return [];
}

// Server component that renders the client component
export default function BlogPostPageRoute() {
  return <PostDetail slug="__dynamic__" />;
}
