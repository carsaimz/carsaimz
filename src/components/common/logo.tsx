'use client';

import Image from 'next/image';

/**
 * Shared Logo component for Carsai Mozambique.
 *
 * Uses INLINE STYLES for width/height to guarantee the container
 * dimensions are ALWAYS respected, regardless of Tailwind class
 * generation, CSS specificity, flex/grid stretching, or any other
 * interference. The 1024×1024 source must NEVER render at full size.
 *
 * The container is a <div> (block-level) for maximum reliability
 * across all layout contexts (flex, grid, sidebar, header, etc.).
 *
 * Usage:
 *   <Logo size="sm" />        // sidebar icon (28px)
 *   <Logo size="md" />        // header (32px)
 *   <Logo size="lg" />        // footer (40px)
 *   <Logo size="xl" />        // auth card (48px)
 *   <Logo size="2xl" />       // loader (64px)
 *   <Logo size="hero" />      // hero section (80-112px responsive)
 */

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

interface LogoProps {
  /** Predefined size variant */
  size?: LogoSize;
  /** Additional CSS classes */
  className?: string;
  /** Alt text override */
  alt?: string;
  /** Whether to use next/image (default: true for optimization) */
  useNextImage?: boolean;
  /** Dark mode brightness boost (for dark backgrounds) */
  brightOnDark?: boolean;
}

/** Pixel dimensions for each size variant — source of truth for inline styles */
const PX_MAP: Record<LogoSize, number> = {
  xs:   20,
  sm:   28,
  md:   32,
  lg:   40,
  xl:   48,
  '2xl': 64,
  hero: 80,   // base; responsive handled via CSS below
};

export function Logo({
  size = 'md',
  className = '',
  alt = 'CarsaiMZ',
  useNextImage = true,
  brightOnDark = false,
}: LogoProps) {
  const px = PX_MAP[size];
  const brightnessClass = brightOnDark ? 'brightness-200' : '';

  const containerStyle: React.CSSProperties = size === 'hero'
    ? {
        width: 80,
        height: 80,
        position: 'relative' as const,
        display: 'inline-block',
        flexShrink: 0,
        overflow: 'hidden',
      }
    : {
        width: px,
        height: px,
        position: 'relative' as const,
        display: 'inline-block',
        flexShrink: 0,
        overflow: 'hidden',
      };

  const containerClass = [
    brightnessClass,
    // Hero responsive overrides via Tailwind (safe because they're
    // just modifiers on the inline-style base)
    size === 'hero' ? 'sm:!w-[96px] sm:!h-[96px] md:!w-[112px] md:!h-[112px]' : '',
    className,
  ].filter(Boolean).join(' ');

  const imgClass = `object-contain ${brightnessClass}`;

  if (useNextImage) {
    return (
      <div className={containerClass} style={containerStyle}>
        <Image
          src="/logo.png"
          alt={alt}
          fill
          sizes={
            size === 'hero'
              ? '(max-width: 640px) 80px, (max-width: 768px) 96px, 112px'
              : `${px}px`
          }
          className={imgClass}
          priority={size === 'hero' || size === '2xl'}
        />
      </div>
    );
  }

  // Fallback to plain <img> for contexts where next/image is problematic
  return (
    <div className={containerClass} style={containerStyle}>
      <img
        src="/logo.png"
        alt={alt}
        width={px}
        height={px}
        className={`w-full h-full ${imgClass}`}
      />
    </div>
  );
}
