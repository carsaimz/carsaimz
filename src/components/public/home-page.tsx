'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { HomeHero } from './home-hero';
import { ServicesSection } from './services-section';
import { ProjectsSection } from './projects-section';
import { TestimonialsSection } from './testimonials-section';
import { AboutSection } from './about-section';
import { ContactSection } from './contact-section';
import { FaqSection } from './faq-section';
import { SocialSection } from './social-section';
import { GradientWaveSVG } from '@/components/common/decorative-svg';
import { AdPlacement } from '@/components/common/ad-renderer';
import { useDocumentTitle } from '@/hooks/use-document-title';

// Dynamic imports for decorative/animation elements (client-side only)
const AfricanPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.AfricanPatternSVG),
  { ssr: false }
);
const TechPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.TechPatternSVG),
  { ssr: false }
);
const FloatingOrbs = dynamic(
  () => import('@/components/common/3d-elements').then((mod) => mod.FloatingOrbs),
  { ssr: false }
);

export function HomePage() {
  useDocumentTitle('nav.home', 'Início', true);
  return (
    <>
      <HomeHero />

      {/* Home Top Banner Ad */}
      <AdPlacement placement="home_top" />

      {/* Services Section */}
      <div className="relative overflow-hidden">
        <Suspense fallback={null}>
          <TechPatternSVG className="top-0 right-0 w-[300px] h-[300px]" opacity={0.04} />
        </Suspense>
        <ServicesSection />
      </div>

      <GradientWaveSVG height={60} />

      {/* Projects Section */}
      <div className="relative overflow-hidden">
        <ProjectsSection />
      </div>

      {/* Home Sidebar Ad (on desktop) */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AdPlacement placement="home_sidebar" />
      </div>

      <GradientWaveSVG height={50} flip />

      {/* Testimonials Section */}
      <div className="relative overflow-hidden">
        <Suspense fallback={null}>
          <FloatingOrbs count={2} opacity={0.06} className="top-0 left-0" />
        </Suspense>
        <TestimonialsSection />
      </div>

      <GradientWaveSVG height={50} />

      {/* About Section */}
      <div className="relative overflow-hidden">
        <Suspense fallback={null}>
          <AfricanPatternSVG className="top-10 right-10 w-[200px] h-[200px]" opacity={0.04} />
        </Suspense>
        <AboutSection />
      </div>

      <GradientWaveSVG height={50} flip />

      {/* Contact Section */}
      <div className="relative overflow-hidden">
        <ContactSection />
      </div>

      <GradientWaveSVG height={40} />

      {/* Social Media Section */}
      <SocialSection />

      {/* Global Banner Ad */}
      <AdPlacement placement="global_banner" />

      {/* FAQ Section */}
      <div className="relative overflow-hidden">
        <Suspense fallback={null}>
          <TechPatternSVG className="bottom-10 left-5 w-[250px] h-[250px]" opacity={0.03} />
        </Suspense>
        <FaqSection />
      </div>

      {/* Footer Banner Ad */}
      <AdPlacement placement="footer" />
    </>
  );
}
