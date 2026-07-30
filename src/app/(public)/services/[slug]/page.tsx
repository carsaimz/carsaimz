import { ServiceDetail } from '@/components/public/service-detail';

export function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

export default function ServiceDetailPage() {
  return <ServiceDetail />;
}
