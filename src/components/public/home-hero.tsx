'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { StatsCounterSection } from '@/components/features/stats-counter';
import { ScrollReveal } from '@/components/common/scroll-reveal';
import { GradientWaveSVG } from '@/components/common/decorative-svg';

// Dynamic imports for 3D/animation elements (client-side only, lightweight)
const FloatingOrbs = dynamic(
  () => import('@/components/common/3d-elements').then((mod) => mod.FloatingOrbs),
  { ssr: false }
);
const ParallaxBackground = dynamic(
  () => import('@/components/common/3d-elements').then((mod) => mod.ParallaxBackground),
  { ssr: false }
);
const ParticleNetwork = dynamic(
  () => import('@/components/common/3d-elements').then((mod) => mod.ParticleNetwork),
  { ssr: false }
);
const MozambiqueMapSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.MozambiqueMapSVG),
  { ssr: false }
);

// New visual effects — dynamic imports for code splitting
const TechParticles = dynamic(
  () => import('@/components/common/visual-effects').then((mod) => mod.TechParticles),
  { ssr: false }
);
const FloatingTechIcons = dynamic(
  () => import('@/components/common/visual-effects').then((mod) => mod.FloatingTechIcons),
  { ssr: false }
);
const GradientMesh = dynamic(
  () => import('@/components/common/visual-effects').then((mod) => mod.GradientMesh),
  { ssr: false }
);
const GlowPulse = dynamic(
  () => import('@/components/common/visual-effects').then((mod) => mod.GlowPulse),
  { ssr: false }
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

export function HomeHero() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-700 min-h-[90vh] flex items-center"
    >
      {/* Gradient Mesh — subtle animated color overlay */}
      <Suspense fallback={null}>
        <GradientMesh opacity={0.06} />
      </Suspense>

      {/* Floating Orbs - background decoration */}
      <Suspense fallback={null}>
        <FloatingOrbs count={4} opacity={0.12} />
      </Suspense>

      {/* Tech Particles — floating dots with mixed colors */}
      <Suspense fallback={null}>
        <TechParticles count={35} color="mixed" />
      </Suspense>

      {/* Floating Tech Icons — FontAwesome icons (code, server, cloud, AI, etc.) */}
      <Suspense fallback={null}>
        <FloatingTechIcons count={10} opacity={0.1} theme="dark" />
      </Suspense>

      {/* Parallax background for subtle depth */}
      <Suspense fallback={null}>
        <ParallaxBackground intensity={15}>
          <div className="absolute inset-0">
            {/* Decorative blurred orbs (existing, enhanced by parallax) */}
            <div className="absolute top-[5%] left-[5%] w-72 h-72 bg-blue-400 rounded-full blur-3xl opacity-10" />
            <div className="absolute bottom-[10%] right-[8%] w-96 h-96 bg-red-400 rounded-full blur-3xl opacity-10" />
            <div className="absolute top-[45%] left-[45%] w-64 h-64 bg-blue-300 rounded-full blur-3xl opacity-10" />
          </div>
        </ParallaxBackground>
      </Suspense>

      {/* Mozambique Map SVG - decorative background */}
      <Suspense fallback={null}>
        <MozambiqueMapSVG className="top-[10%] right-[5%] w-[500px] h-[250px] opacity-[0.06]" opacity={0.06} />
      </Suspense>

      {/* Particle Network - subtle tech overlay */}
      <Suspense fallback={null}>
        <ParticleNetwork className="bottom-[15%] left-[5%] w-[400px] h-[400px]" particleCount={20} color="#D32F2F" />
      </Suspense>

      {/* Glow pulses behind CTA area */}
      <Suspense fallback={null}>
        <GlowPulse className="left-1/2 top-[55%] -translate-x-1/2" color="rgba(250, 204, 21, 0.08)" size={300} />
      </Suspense>
      <Suspense fallback={null}>
        <GlowPulse className="left-[30%] top-[40%]" color="rgba(59, 130, 246, 0.06)" size={200} />
      </Suspense>

      {/* Mozambique flag stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-green-500" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge - ScrollReveal */}
          <ScrollReveal animation="fadeUp" delay={0}>
            <motion.div variants={itemVariants} className="mb-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-red-700/50 text-red-200 text-sm font-medium border border-red-600/30">
                {t('home.heroBadge')}
              </span>
            </motion.div>
          </ScrollReveal>

          {/* Logo prominently displayed - ScrollReveal */}
          <ScrollReveal animation="fadeUp" delay={100}>
            <motion.div variants={itemVariants} className="mb-6">
              <img src="/logo.png" alt="CarsaiMZ Logo" className="h-20 sm:h-24 md:h-28 w-auto mx-auto drop-shadow-lg" />
            </motion.div>
          </ScrollReveal>

          {/* Title - ScrollReveal */}
          <ScrollReveal animation="fadeUp" delay={200}>
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              {t('home.heroTitle')}
            </motion.h1>
          </ScrollReveal>

          {/* Subtitle - ScrollReveal */}
          <ScrollReveal animation="fadeUp" delay={300}>
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl md:text-2xl text-red-100 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              {t('home.heroSubtitle')}
            </motion.p>
          </ScrollReveal>

          {/* CTA Buttons - ScrollReveal */}
          <ScrollReveal animation="scaleUp" delay={400}>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-semibold px-8 py-3 text-base rounded-xl shadow-lg shadow-yellow-400/25 transition-all hover:shadow-xl hover:shadow-yellow-400/30"
                onClick={() => router.push('/services')}
              >
                {t('home.heroCtaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/25 hover:text-white font-semibold px-8 py-3 text-base rounded-xl backdrop-blur-sm transition-all shadow-lg shadow-black/10"
                onClick={() => router.push('/services')}
              >
                {t('home.heroCtaSecondary')}
              </Button>
            </motion.div>
          </ScrollReveal>

          {/* Stats Row - ScrollReveal with stagger */}
          <ScrollReveal animation="fadeUp" delay={500} stagger staggerDelay={100}>
            <motion.div variants={itemVariants}>
              <StatsCounterSection />
            </motion.div>
          </ScrollReveal>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Gradient Wave Divider */}
      <GradientWaveSVG className="absolute bottom-0 left-0 right-0" height={60} />
    </section>
  );
}
