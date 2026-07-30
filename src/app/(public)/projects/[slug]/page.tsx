import { ProjectDetail } from '@/components/public/project-detail';

export function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
