import { TopicDetail } from '@/components/forum/topic-detail';

// Required for static export (output: "export"):
// Must return at least one param so Next.js generates a static HTML fallback.
// The Capacitor app handles navigation client-side — the actual slug
// is resolved by the TopicDetail component via URL params.
export async function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

// Generate metadata for the forum topic page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug || slug === '__dynamic__') {
      return { title: 'CarsaiMz - Fórum' };
    }

    // Try to fetch the topic title from Firestore
    const { firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client');
    if (isFirebaseConfigured() && firestoreClient) {
      const { doc, getDoc } = await import('firebase/firestore');
      const topicRef = doc(firestoreClient, 'forum_topics', slug);
      const topicSnap = await getDoc(topicRef);
      if (topicSnap.exists()) {
        const data = topicSnap.data();
        return { title: `CarsaiMz - ${data.title || slug}` };
      }
    }
  } catch {
    // Fallback if Firestore is not available
  }
  return { title: 'CarsaiMz - Fórum' };
}

// Server component that renders the client component
// TopicDetail uses useParams() internally to get the actual slug from the URL
export default function ForumTopicPageRoute() {
  return <TopicDetail />;
}
