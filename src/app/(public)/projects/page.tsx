import { ProjectsSection } from '@/components/public/projects-section';
import { AdPlacement } from '@/components/common/ad-renderer';

export default function ProjectsPageRoute() {
  return (
    <>
      <AdPlacement placement="projects_top" />
      <ProjectsSection />
    </>
  );
}
