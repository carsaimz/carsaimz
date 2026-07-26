'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleUp' | 'flip';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
}

// Animation CSS transforms for each type
const animationStyles: Record<string, { initial: string; visible: string }> = {
  fadeUp: {
    initial: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  fadeDown: {
    initial: 'opacity-0 -translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  fadeLeft: {
    initial: 'opacity-0 -translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  fadeRight: {
    initial: 'opacity-0 translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  scaleUp: {
    initial: 'opacity-0 scale-90',
    visible: 'opacity-100 scale-100',
  },
  flip: {
    initial: 'opacity-0 [transform:rotateX(20deg)]',
    visible: 'opacity-100 [transform:rotateX(0deg)]',
  },
};

// Reduced motion fallback - simple opacity transition
const reducedMotionStyles = {
  initial: 'opacity-0',
  visible: 'opacity-100',
};

export function ScrollReveal({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = '',
  stagger = false,
  staggerDelay = 100,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Intersection Observer - only triggers once
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element); // Only trigger once
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  const effectiveDuration = prefersReducedMotion ? 200 : duration;
  const styles = prefersReducedMotion ? reducedMotionStyles : animationStyles[animation];

  // For stagger animations, add delay to each child
  if (stagger) {
    return (
      <div ref={containerRef} className={className}>
        {Array.isArray(children) ? (
          (children as ReactNode[]).map((child, index) => (
            <div
              key={index}
              className={`transition-all ${isVisible ? styles.visible : styles.initial}`}
              style={{
                transitionDuration: `${effectiveDuration}ms`,
                transitionDelay: `${delay + index * (prefersReducedMotion ? 0 : staggerDelay)}ms`,
                transitionProperty: 'opacity, transform',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {child}
            </div>
          ))
        ) : (
          <div
            className={`transition-all ${isVisible ? styles.visible : styles.initial}`}
            style={{
              transitionDuration: `${effectiveDuration}ms`,
              transitionDelay: `${delay}ms`,
              transitionProperty: 'opacity, transform',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`transition-all ${isVisible ? styles.visible : styles.initial} ${className}`}
      style={{
        transitionDuration: `${effectiveDuration}ms`,
        transitionDelay: `${delay}ms`,
        transitionProperty: 'opacity, transform',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}
