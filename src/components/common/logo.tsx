'use client';

import Image from 'next/image';

/**
 * Shared Logo component for Carsai Mozambique.
 *
 * Replaces all scattered `<img src="/logo.png">` usages with a single,
 * size-controlled component. The source image is 1024×1024px; this
 * component constrains it to the requested size via both CSS classes
 * and HTML width/height attributes to prevent layout shift.
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

const SIZE_MAP: Record<LogoSize, { css: string; w: number; h: number }> = {
  xs:   { css: 'h-5 w-auto max-w-[1.25rem]',    w: 20,  h: 20  },
  sm:   { css: 'h-7 w-auto max-w-[1.75rem]',    w: 28,  h: 28  },
  md:   { css: 'h-8 w-auto max-w-[2rem]',       w: 32,  h: 32  },
  lg:   { css: 'h-10 w-auto max-w-[2.5rem]',    w: 40,  h: 40  },
  xl:   { css: 'h-12 w-auto max-w-[3rem]',      w: 48,  h: 48  },
  '2xl': { css: 'h-16 w-auto max-w-[4rem]',     w: 64,  h: 64  },
  hero: { css: 'h-20 sm:h-24 md:h-28 w-auto max-w-[5rem] sm:max-w-[6rem] md:max-w-[7rem]', w: 112, h: 112 },
};

export function Logo({
  size = 'md',
  className = '',
  alt = 'CarsaiMZ',
  useNextImage = true,
  brightOnDark = false,
}: LogoProps) {
  const { css, w, h } = SIZE_MAP[size];
  const combinedClass = `${css} shrink-0 object-contain ${brightOnDark ? 'brightness-200' : ''} ${className}`.trim();

  if (useNextImage) {
    return (
      <Image
        src="/logo.png"
        alt={alt}
        width={w}
        height={h}
        className={combinedClass}
        priority={size === 'hero' || size === '2xl'}
      />
    );
  }

  // Fallback to plain <img> for contexts where next/image is problematic
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={w}
      height={h}
      className={combinedClass}
    />
  );
}
