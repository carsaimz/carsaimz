'use client';

import { motion } from 'framer-motion';
import {
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Youtube,
  Github,
  ExternalLink,
} from 'lucide-react';
import { GITHUB_URL } from '@/lib/client-config';
import { useLanguage } from '@/contexts/language-context';
import { GradientWaveSVG } from '@/components/common/decorative-svg';

interface SocialLink {
  name: string;
  handle: string;
  url: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  bgColor: string;
}

const socialLinks: SocialLink[] = [
  {
    name: 'WhatsApp',
    handle: '+258 84 754 5020',
    url: 'https://wa.me/258847545020',
    icon: <MessageCircle className="h-7 w-7" />,
    color: 'text-green-400',
    hoverColor: 'group-hover:text-green-300',
    bgColor: 'from-green-500/20 to-green-600/10',
  },
  {
    name: 'Facebook',
    handle: '@carsaimz',
    url: 'https://facebook.com/carsaimz',
    icon: <Facebook className="h-7 w-7" />,
    color: 'text-blue-400',
    hoverColor: 'group-hover:text-blue-300',
    bgColor: 'from-blue-500/20 to-blue-600/10',
  },
  {
    name: 'Instagram',
    handle: '@carsaimz',
    url: 'https://instagram.com/carsaimz',
    icon: <Instagram className="h-7 w-7" />,
    color: 'text-pink-400',
    hoverColor: 'group-hover:text-pink-300',
    bgColor: 'from-pink-500/20 to-purple-600/10',
  },
  {
    name: 'TikTok',
    handle: '@carsaimz',
    url: 'https://tiktok.com/@carsaimz',
    icon: <Globe className="h-7 w-7" />,
    color: 'text-cyan-400',
    hoverColor: 'group-hover:text-cyan-300',
    bgColor: 'from-cyan-500/20 to-cyan-600/10',
  },
  {
    name: 'YouTube',
    handle: '@carsaimz',
    url: 'https://youtube.com/@carsaimz',
    icon: <Youtube className="h-7 w-7" />,
    color: 'text-red-400',
    hoverColor: 'group-hover:text-red-300',
    bgColor: 'from-red-500/20 to-red-600/10',
  },
  {
    name: 'Discord',
    handle: 'carsaimz',
    url: 'https://discord.gg/carsaimz',
    icon: <MessageCircle className="h-7 w-7" />,
    color: 'text-indigo-400',
    hoverColor: 'group-hover:text-indigo-300',
    bgColor: 'from-indigo-500/20 to-indigo-600/10',
  },
  {
    name: 'GitHub',
    handle: 'carsaimz',
    url: GITHUB_URL,
    icon: <Github className="h-7 w-7" />,
    color: 'text-gray-300',
    hoverColor: 'group-hover:text-white',
    bgColor: 'from-gray-500/20 to-gray-600/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export function SocialSection() {
  const { t } = useLanguage();

  return (
    <section id="social" className="relative overflow-hidden">
      {/* Mozambique flag stripe at top */}
      <div className="h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-green-600" />

      {/* Main content with dark gradient background */}
      <div className="bg-gradient-to-b from-red-900 via-red-800 to-emerald-900 py-16 sm:py-24">
        {/* Subtle decorative pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t('social.title')}
            </motion.h2>
            <motion.p
              className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t('social.subtitle')}
            </motion.p>

            {/* Decorative divider */}
            <motion.div
              className="flex items-center justify-center gap-2 mt-6"
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-400" />
            </motion.div>
          </motion.div>

          {/* Social Media Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {socialLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={cardVariants}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative rounded-xl border border-white/10 bg-gradient-to-br ${link.bgColor} backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/25 hover:shadow-xl hover:shadow-black/20`}
              >
                {/* Icon */}
                <div className={`mb-4 ${link.color} ${link.hoverColor} transition-colors duration-300`}>
                  {link.icon}
                </div>

                {/* Platform name */}
                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-white/90 transition-colors">
                  {link.name}
                </h3>

                {/* Handle / URL */}
                <p className="text-white/50 text-sm mb-4 truncate">
                  {link.handle}
                </p>

                {/* Visit button */}
                <div className="flex items-center gap-1.5 text-white/60 text-sm font-medium group-hover:text-white/80 transition-colors duration-300">
                  <span>Visit</span>
                  <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </div>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
              </motion.a>
            ))}
          </motion.div>

          {/* CTA below grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-10 sm:mt-14"
          >
            <p className="text-white/40 text-sm">
              🇲🇿 Carsai Mozambique &mdash; Montepuez, Cabo Delgado
            </p>
          </motion.div>
        </div>
      </div>

      {/* Gradient wave divider at bottom */}
      <GradientWaveSVG height={60} />
    </section>
  );
}
