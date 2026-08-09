'use client';

import Image from 'next/image';

/**
 * Shared Logo component for Carsai Mozambique.
 *
 * Uses a fixed-size container span + next/image with `fill` prop
 * to guarantee CSS-determined dimensions are always respected,
 * preventing next/image inline-style overrides that caused the
 * 1024×1024 source to render at full size.
 *
 * Usage:
 *   <Logo size="sm" />        // sidebar icon (1.75rem ≈ 28px)
 *   <Logo size="md" />        // header (2rem ≈ 32px)
 *   <Logo size="lg" />        // footer (2.5rem ≈ 40px)
 *   <Logo size="xl" />        // auth card (3rem ≈ 48px)
 *   <Logo size="2xl" />       // loader (4rem ≈ 64px)
 *   <Logo size="hero" />      // hero section (5-7rem responsive)
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

/** Maps each size to the CSS classes applied to the *container* span. */
const SIZE_MAP: Record<LogoSize, string> = {
  xs:   'h-5 w-5',                                                              // 20×20
  sm:   'h-7 w-7',                                                              // 28×28
  md:   'h-8 w-8',                                                              // 32×32
  lg:   'h-10 w-10',                                                            // 40×40
  xl:   'h-12 w-12',                                                            // 48×48
  '2xl': 'h-16 w-16',                                                           // 64×64
  hero: 'h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28',                           // 80→96→112
};

export function Logo({
  size = 'md',
  className = '',
  alt = 'CarsaiMZ',
  useNextImage = true,
  brightOnDark = false,
}: LogoProps) {
  const containerClass = [
    SIZE_MAP[size],
    'relative inline-block shrink-0 overflow-hidden',
    brightOnDark ? 'brightness-200' : '',
    className,
  ].filter(Boolean).join(' ');

  const imgClass = `object-contain ${brightOnDark ? 'brightness-200' : ''}`;

  if (useNextImage) {
    return (
      <span className={containerClass}>
        <Image
          src="/logo.png"
          alt={alt}
          fill
          sizes={size === 'hero' ? '(max-width: 640px) 80px, (max-width: 768px) 96px, 112px' : SIZE_MAP[size].replace(/h-\d+ w-\d+/, '').trim() || '48px'}
          className={imgClass}
          priority={size === 'hero' || size === '2xl'}
        />
      </span>
    );
  }

  // Fallback to plain <img> for contexts where next/image is problematic
  const pxMap: Record<LogoSize, number> = { xs: 20, sm: 28, md: 32, lg: 40, xl: 48, '2xl': 64, hero: 80 };
  return (
    <span className={containerClass}>
      <img
        src="/logo.png"
        alt={alt}
        width={pxMap[size]}
        height={pxMap[size]}
        className={`w-full h-full ${imgClass}`}
      />
    </span>
  );
}
