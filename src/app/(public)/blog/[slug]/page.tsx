import { PostDetail } from '@/components/blog/post-detail';

// Required for static export (output: "export"):
// Must return at least one param so Next.js generates a static HTML fallback.
// The Capacitor app handles navigation client-side — the actual slug
// is resolved by the PostDetail component via URL/store state.
export async function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

// Server component that renders the client component
export default function BlogPostPageRoute() {
  return <PostDetail slug="__dynamic__" />;
}
