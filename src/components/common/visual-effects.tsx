'use client';

/**
 * Carsai Mozambique — Visual Effects Components
 *
 * Lightweight CSS-based visual effects for hero and sections.
 * NO canvas, NO heavy libs — pure CSS animations + React.
 * Respects prefers-reduced-motion.
 *
 * Components:
 * - TechParticles: CSS animated floating dots/sparks
 * - FloatingTechIcons: FontAwesome tech icons floating gently
 * - GlowPulse: Subtle pulsing glow effect
 * - GradientMesh: Animated gradient mesh background
 */

import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode,
  faServer,
  faCloud,
  faRobot,
  faMobileScreen,
  faDatabase,
  faShieldHalved,
  faMicrochip,
  faGlobe,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import {
  faGithub,
  faAws,
  faDocker,
  faReact,
} from '@fortawesome/free-brands-svg-icons';

// ──────────────────────────────────────────────
// TechParticles: Lightweight floating particle dots
// Pure CSS animation — zero JS per frame
// ──────────────────────────────────────────────

interface TechParticlesProps {
  count?: number;
  className?: string;
  color?: 'red' | 'blue' | 'emerald' | 'amber' | 'mixed';
}

const PARTICLE_COLORS = {
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  mixed: '',
};

export function TechParticles({
  count = 30,
  className = '',
  color = 'mixed',
}: TechParticlesProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const mixedColors = ['bg-red-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-yellow-400'];

  const particles = Array.from({ length: count }, (_, i) => {
    const size = 2 + (i % 4); // 2-5px
    const x = (i * 37 + 13) % 100;
    const y = (i * 23 + 7) % 100;
    const delay = ((i * 0.4) % 6).toFixed(1);
    const duration = (3 + (i % 4) * 2).toString(); // 3-9s
    const opacity = (0.15 + (i % 5) * 0.08).toFixed(2);
    const particleColor = color === 'mixed'
      ? mixedColors[i % mixedColors.length]
      : PARTICLE_COLORS[color];

    return { id: i, size, x, y, delay, duration, opacity, color: particleColor };
  });

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color} ${prefersReducedMotion ? '' : 'animate-tech-particle'}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// FloatingTechIcons: FontAwesome tech icons floating gently
// ──────────────────────────────────────────────

interface FloatingTechIconsProps {
  className?: string;
  /** Number of icons to show (default 8) */
  count?: number;
  /** Base opacity (default 0.12) */
  opacity?: number;
  /** Color theme */
  theme?: 'light' | 'dark';
}

const TECH_ICONS = [
  { icon: faCode, label: 'code' },
  { icon: faServer, label: 'server' },
  { icon: faCloud, label: 'cloud' },
  { icon: faRobot, label: 'ai' },
  { icon: faMobileScreen, label: 'mobile' },
  { icon: faDatabase, label: 'db' },
  { icon: faShieldHalved, label: 'security' },
  { icon: faMicrochip, label: 'chip' },
  { icon: faGlobe, label: 'web' },
  { icon: faRocket, label: 'deploy' },
  { icon: faGithub, label: 'github' },
  { icon: faReact, label: 'react' },
  { icon: faDocker, label: 'docker' },
  { icon: faAws, label: 'aws' },
];

// Pre-defined positions to avoid random layout shifts
const ICON_POSITIONS = [
  { x: 5, y: 15 },
  { x: 88, y: 20 },
  { x: 12, y: 65 },
  { x: 82, y: 70 },
  { x: 45, y: 8 },
  { x: 65, y: 85 },
  { x: 25, y: 40 },
  { x: 72, y: 35 },
  { x: 35, y: 78 },
  { x: 55, y: 55 },
  { x: 92, y: 50 },
  { x: 8, y: 88 },
  { x: 48, y: 30 },
  { x: 78, y: 12 },
];

const ICON_SIZES = [20, 18, 22, 16, 20, 18, 16, 22, 18, 20, 16, 18, 20, 16];

export function FloatingTechIcons({
  className = '',
  count = 8,
  opacity = 0.12,
  theme = 'dark',
}: FloatingTechIconsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const iconColor = theme === 'dark' ? 'text-white' : 'text-red-900';
  const selectedIcons = TECH_ICONS.slice(0, count);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {selectedIcons.map((item, i) => {
        const pos = ICON_POSITIONS[i % ICON_POSITIONS.length];
        const size = ICON_SIZES[i % ICON_SIZES.length];
        const delay = (i * 0.5 % 4).toFixed(1);
        const duration = (6 + (i % 3) * 2).toString(); // 6-10s

        return (
          <div
            key={item.label}
            className={`absolute ${iconColor} ${prefersReducedMotion ? '' : 'animate-float-icon'}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              opacity,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              fontSize: size,
            }}
          >
            <FontAwesomeIcon icon={item.icon} />
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// GlowPulse: Subtle pulsing glow behind elements
// ──────────────────────────────────────────────

interface GlowPulseProps {
  className?: string;
  color?: string;
  size?: number;
}

export function GlowPulse({
  className = '',
  color = 'rgba(220, 38, 38, 0.15)',
  size = 200,
}: GlowPulseProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className} ${prefersReducedMotion ? '' : 'animate-glow-pulse'}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      aria-hidden="true"
    />
  );
}

// ──────────────────────────────────────────────
// GradientMesh: Animated gradient mesh overlay
// Uses CSS conic-gradient animation
// ──────────────────────────────────────────────

interface GradientMeshProps {
  className?: string;
  opacity?: number;
}

export function GradientMesh({
  className = '',
  opacity = 0.05,
}: GradientMeshProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className} ${prefersReducedMotion ? '' : 'animate-gradient-mesh'}`}
      style={{
        opacity,
        background: `
          conic-gradient(from 0deg at 20% 30%, #dc2626, transparent 40%),
          conic-gradient(from 120deg at 80% 70%, #2563eb, transparent 40%),
          conic-gradient(from 240deg at 50% 50%, #10b981, transparent 40%)
        `,
        filter: 'blur(40px)',
      }}
      aria-hidden="true"
    />
  );
}

// ──────────────────────────────────────────────
// SparkleLine: Animated SVG line that sparkles
// ──────────────────────────────────────────────

interface SparkleLineProps {
  className?: string;
  color?: string;
}

export function SparkleLine({
  className = '',
  color = '#dc2626',
}: SparkleLineProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <svg
      viewBox="0 0 200 20"
      className={`absolute pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <line
        x1="0" y1="10" x2="200" y2="10"
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="4 8"
        opacity="0.2"
        className={prefersReducedMotion ? '' : 'animate-sparkle-dash'}
        style={{ animationDuration: '8s' }}
      />
      <circle
        cx="10" cy="10" r="1.5"
        fill={color}
        opacity="0.3"
        className={prefersReducedMotion ? '' : 'animate-sparkle-dot'}
        style={{ animationDuration: '3s' }}
      />
      <circle
        cx="100" cy="10" r="1"
        fill={color}
        opacity="0.2"
        className={prefersReducedMotion ? '' : 'animate-sparkle-dot'}
        style={{ animationDuration: '4s', animationDelay: '1s' }}
      />
      <circle
        cx="180" cy="10" r="1.2"
        fill={color}
        opacity="0.25"
        className={prefersReducedMotion ? '' : 'animate-sparkle-dot'}
        style={{ animationDuration: '3.5s', animationDelay: '2s' }}
      />
    </svg>
  );
}
