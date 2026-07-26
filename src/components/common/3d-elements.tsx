'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion';

// ──────────────────────────────────────────────
// FloatingOrbs: Animated floating gradient orbs
// Uses CSS animations for smooth performance
// ──────────────────────────────────────────────

interface FloatingOrbsProps {
  count?: number;
  className?: string;
  opacity?: number;
}

export function FloatingOrbs({ count = 4, className = '', opacity = 0.15 }: FloatingOrbsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const orbs = Array.from({ length: count }, (_, i) => {
    const colors = [
      'from-emerald-400 to-green-300',
      'from-yellow-400 to-amber-300',
      'from-green-500 to-emerald-400',
      'from-amber-300 to-yellow-500',
      'from-emerald-300 to-teal-400',
    ];
    const sizes = ['w-72 h-72', 'w-96 h-96', 'w-64 h-64', 'w-80 h-80', 'w-56 h-56'];
    const positions = [
      'top-[10%] left-[5%]',
      'top-[60%] right-[10%]',
      'top-[40%] left-[50%]',
      'bottom-[5%] left-[30%]',
      'top-[20%] right-[40%]',
    ];
    const animationDelays = ['0s', '2s', '4s', '1s', '3s'];
    const animationDurations = ['8s', '10s', '12s', '9s', '11s'];

    return {
      id: i,
      color: colors[i % colors.length],
      size: sizes[i % sizes.length],
      position: positions[i % positions.length],
      delay: animationDelays[i % animationDelays.length],
      duration: animationDurations[i % animationDurations.length],
    };
  });

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={`absolute ${orb.position} ${orb.size} rounded-full bg-gradient-to-br ${orb.color} blur-3xl ${prefersReducedMotion ? '' : 'animate-float-orb'}`}
          style={{
            opacity,
            animationDelay: prefersReducedMotion ? '0s' : orb.delay,
            animationDuration: prefersReducedMotion ? '0s' : orb.duration,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// ParallaxBackground: Lightweight parallax effect
// Uses CSS transform only - mouse on desktop, scroll on mobile
// ──────────────────────────────────────────────

interface ParallaxBackgroundProps {
  className?: string;
  intensity?: number;
  children?: React.ReactNode;
}

export function ParallaxBackground({ className = '', intensity = 20, children }: ParallaxBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    if (isMobile) {
      // On mobile: use scroll position for parallax
      const handleScroll = () => {
        const scrollY = window.scrollY;
        setOffset({ x: 0, y: scrollY * intensity * 0.01 });
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      // On desktop: use mouse position for parallax
      const handleMouseMove = (e: MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const x = (e.clientX - centerX) / centerX * intensity;
        const y = (e.clientY - centerY) / centerY * intensity;
        setOffset({ x, y });
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isMobile, intensity, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        transform: prefersReducedMotion
          ? 'none'
          : `translate(${offset.x}px, ${offset.y}px)`,
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// MorphingShape: SVG shape that morphs between states
// Uses CSS animations
// ──────────────────────────────────────────────

interface MorphingShapeProps {
  className?: string;
  color?: string;
  size?: number;
}

export function MorphingShape({
  className = '',
  color = 'rgba(16, 185, 129, 0.1)',
  size = 300,
}: MorphingShapeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`absolute pointer-events-none ${className} ${prefersReducedMotion ? '' : 'animate-morph-shape'}`}
      aria-hidden="true"
    >
      <path
        d="M40,100 C40,60 80,40 100,40 C120,40 160,60 160,100 C160,140 120,160 100,160 C80,160 40,140 40,100 Z"
        fill={color}
      />
    </svg>
  );
}

// ──────────────────────────────────────────────
// ParticleNetwork: SVG particle network with connecting lines
// Lightweight - ~25 particles
// ──────────────────────────────────────────────

interface ParticleNetworkProps {
  className?: string;
  particleCount?: number;
  color?: string;
}

export function ParticleNetwork({
  className = '',
  particleCount = 25,
  color = '#10b981',
}: ParticleNetworkProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Generate deterministic particles
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    cx: 10 + (i * 37) % 90,
    cy: 10 + (i * 23 + 15) % 85,
    r: 1.5 + (i % 3) * 0.5,
    opacity: 0.3 + (i % 5) * 0.1,
    delay: (i * 0.3) % 5,
  }));

  // Generate connections between nearby particles
  const connections: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].cx - particles[j].cx;
      const dy = particles[i].cy - particles[j].cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 25) {
        connections.push({
          x1: particles[i].cx,
          y1: particles[i].cy,
          x2: particles[j].cx,
          y2: particles[j].cy,
          opacity: Math.max(0.05, 0.15 - dist * 0.005),
        });
      }
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`absolute pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Connections */}
      {connections.map((conn, i) => (
        <line
          key={`conn-${i}`}
          x1={conn.x1}
          y1={conn.y1}
          x2={conn.x2}
          y2={conn.y2}
          stroke={color}
          strokeWidth="0.15"
          opacity={conn.opacity}
        />
      ))}
      {/* Particles */}
      {particles.map((p) => (
        <circle
          key={`p-${p.id}`}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={color}
          opacity={p.opacity}
          className={prefersReducedMotion ? '' : 'animate-particle-float'}
          style={{
            animationDelay: `${p.delay}s`,
            animationDuration: prefersReducedMotion ? '0s' : '4s',
          }}
        />
      ))}
    </svg>
  );
}

// ──────────────────────────────────────────────
// RotatingCube: CSS-only 3D rotating cube
// Uses CSS transforms for the cube faces
// ──────────────────────────────────────────────

interface RotatingCubeProps {
  className?: string;
  size?: number;
  color?: string;
}

export function RotatingCube({
  className = '',
  size = 60,
  color = '#10b981',
}: RotatingCubeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const halfSize = size / 2;
  const faceOpacity = 0.15;
  const faceBorder = `1px solid ${color}`;

  const faceStyles: Record<string, React.CSSProperties> = {
    front: { transform: `translateZ(${halfSize}px)` },
    back: { transform: `rotateY(180deg) translateZ(${halfSize}px)` },
    right: { transform: `rotateY(90deg) translateZ(${halfSize}px)` },
    left: { transform: `rotateY(-90deg) translateZ(${halfSize}px)` },
    top: { transform: `rotateX(90deg) translateZ(${halfSize}px)` },
    bottom: { transform: `rotateX(-90deg) translateZ(${halfSize}px)` },
  };

  return (
    <div
      className={`relative pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={`w-full h-full ${prefersReducedMotion ? '' : 'animate-rotate-cube'}`}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '800px',
        }}
      >
        {Object.entries(faceStyles).map(([face, style]) => (
          <div
            key={face}
            className="absolute inset-0"
            style={{
              ...style,
              background: color,
              opacity: faceOpacity,
              border: faceBorder,
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    </div>
  );
}
