'use client';

import { useAppStore } from '@/lib/store';
import { HomePage } from '@/components/public/home-page';
import { ServicesSection } from '@/components/public/services-section';
import { ProjectsSection } from '@/components/public/projects-section';
import { AboutSection } from '@/components/public/about-section';
import { ContactSection } from '@/components/public/contact-section';
import { FaqSection } from '@/components/public/faq-section';
import { TestimonialsSection } from '@/components/public/testimonials-section';
import { BlogPage } from '@/components/blog/blog-page';
import { PostDetail } from '@/components/blog/post-detail';
import { ForumPage } from '@/components/forum/forum-page';
import { TopicDetail } from '@/components/forum/topic-detail';
import { UserDashboard } from '@/components/user/user-dashboard';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { PartnerDashboard } from '@/components/partner/partner-dashboard';
import { FinancialSection } from '@/components/financial/financial-section';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'services':
        return <ServicesSection />;
      case 'projects':
        return <ProjectsSection />;
      case 'about':
        return <AboutSection />;
      case 'contact':
        return <ContactSection />;
      case 'faq':
        return <FaqSection />;
      case 'testimonials':
        return <TestimonialsSection />;
      case 'blog':
        return <BlogPage />;
      case 'blogPost':
        return <PostDetail />;
      case 'forum':
        return <ForumPage />;
      case 'forumTopic':
        return <TopicDetail />;
      case 'dashboard':
        return <UserDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'partner':
        return <PartnerDashboard />;
      case 'financial':
        return <FinancialSection />;
      case 'vehicles':
        return <UserDashboard />;
      case 'partners':
        return <AdminDashboard />;
      case 'reports':
        return <AdminDashboard />;
      case 'settings':
        return <UserDashboard />;
      case 'map':
        return <UserDashboard />;
      case 'analytics':
        return <AdminDashboard />;
      default:
        return <HomePage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
}
