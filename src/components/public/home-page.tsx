'use client';

import { HomeHero } from './home-hero';
import { ServicesSection } from './services-section';
import { ProjectsSection } from './projects-section';
import { TestimonialsSection } from './testimonials-section';
import { AboutSection } from './about-section';
import { ContactSection } from './contact-section';
import { FaqSection } from './faq-section';

export function HomePage() {
  return (
    <>
      <HomeHero />
      <ServicesSection />
      <ProjectsSection />
      <TestimonialsSection />
      <AboutSection />
      <ContactSection />
      <FaqSection />
    </>
  );
}
