import { ProjectDetail } from '@/components/public/project-detail';

export function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

// Generate metadata for the project detail page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug || slug === '__dynamic__') {
      return { title: 'CarsaiMz - Projectos' };
    }

    // Try to fetch the project title from Firestore
    const { firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client');
    if (isFirebaseConfigured() && firestoreClient) {
      const { doc, getDoc } = await import('firebase/firestore');
      const projectRef = doc(firestoreClient, 'projects', slug);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const data = projectSnap.data();
        return { title: `CarsaiMz - ${data.title || slug}` };
      }
    }
  } catch {
    // Fallback if Firestore is not available
  }
  return { title: 'CarsaiMz - Projectos' };
}

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
