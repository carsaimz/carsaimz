import { PostDetail } from '@/components/blog/post-detail';

// Required for static export (output: "export"):
// Must return at least one param so Next.js generates a static HTML fallback.
// The Capacitor app handles navigation client-side — the actual slug
// is resolved by the PostDetail component via URL/store state.
export async function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

// Generate metadata for the blog post page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug || slug === '__dynamic__') {
      return { title: 'CarsaiMz - Blog' };
    }

    // Try to fetch the post title from Firestore
    const { firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client');
    if (isFirebaseConfigured() && firestoreClient) {
      const { doc, getDoc } = await import('firebase/firestore');
      const postRef = doc(firestoreClient, 'blog_posts', slug);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const data = postSnap.data();
        return { title: `CarsaiMz - ${data.title || slug}` };
      }
    }
  } catch {
    // Fallback if Firestore is not available
  }
  return { title: 'CarsaiMz - Blog' };
}

// Server component that renders the client component
export default function BlogPostPageRoute() {
  return <PostDetail slug="__dynamic__" />;
}
