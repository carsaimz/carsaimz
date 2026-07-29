'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Briefcase, Users, Clock, Award, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

// ──────────────────────────────────────────────
// Animated Stats Counter Component
// ──────────────────────────────────────────────

interface StatsCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function StatsCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2,
  className = '',
}: StatsCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        const displayValue = value <= 10
          ? latest.toFixed(1)
          : Math.floor(latest).toString();
        ref.current.textContent = `${prefix}${displayValue}${suffix}`;
      }
    });

    return unsubscribe;
  }, [springValue, prefix, suffix, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

// ──────────────────────────────────────────────
// Stats Section Component (for Hero)
// ──────────────────────────────────────────────

interface StatItem {
  icon: LucideIcon;
  value: number;
  suffix: string;
  labelKey: string;
}

interface StatsData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalProjects: number;
    totalServices: number;
    totalForumTopics: number;
    totalTestimonials: number;
    totalRevenue: number;
    confirmedRevenue: number;
  };
}

export function StatsCounterSection() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/stats')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(() => {
        // Silently fail - will show loading state
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatsItems = (): StatItem[] => {
    if (stats) {
      return [
        { icon: Briefcase, value: stats.overview.totalProjects, suffix: '+', labelKey: 'stats.projects' },
        { icon: Users, value: stats.overview.totalUsers, suffix: '+', labelKey: 'stats.clients' },
        { icon: Clock, value: 5, suffix: '+', labelKey: 'stats.years' },
        { icon: Award, value: 24, suffix: '/7', labelKey: 'stats.support' },
      ];
    }
    // Default values when no data available yet
    return [
      { icon: Briefcase, value: 0, suffix: '+', labelKey: 'stats.projects' },
      { icon: Users, value: 0, suffix: '+', labelKey: 'stats.clients' },
      { icon: Clock, value: 5, suffix: '+', labelKey: 'stats.years' },
      { icon: Award, value: 24, suffix: '/7', labelKey: 'stats.support' },
    ];
  };

  const STATS = getStatsItems();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
    >
      {STATS.map((stat, idx) => (
        <motion.div
          key={stat.labelKey}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors"
        >
          <stat.icon className="h-6 w-6 text-yellow-400 mb-2 mx-auto" />
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            <StatsCounter
              value={stat.value}
              suffix={stat.suffix}
              duration={2}
            />
          </div>
          <div className="text-sm text-emerald-200">
            {t(stat.labelKey)}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
