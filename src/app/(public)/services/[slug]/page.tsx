import { ServiceDetail } from '@/components/public/service-detail';

export function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

// Generate metadata for the service detail page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug || slug === '__dynamic__') {
      return { title: 'CarsaiMz - Serviços' };
    }

    // Try to fetch the service title from Firestore
    const { firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client');
    if (isFirebaseConfigured() && firestoreClient) {
      const { doc, getDoc } = await import('firebase/firestore');
      const serviceRef = doc(firestoreClient, 'services', slug);
      const serviceSnap = await getDoc(serviceRef);
      if (serviceSnap.exists()) {
        const data = serviceSnap.data();
        return { title: `CarsaiMz - ${data.title || slug}` };
      }
    }
  } catch {
    // Fallback if Firestore is not available
  }
  return { title: 'CarsaiMz - Serviços' };
}

export default function ServiceDetailPage() {
  return <ServiceDetail />;
}
