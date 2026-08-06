import { ServicesSection } from '@/components/public/services-section';
import { AdPlacement } from '@/components/common/ad-renderer';

export default function ServicesPageRoute() {
  return (
    <>
      <AdPlacement placement="services_top" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <ServicesSection />
          </div>
          <aside className="hidden lg:block w-[300px] shrink-0">
            <AdPlacement placement="services_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
