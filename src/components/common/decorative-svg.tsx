'use client';

// ──────────────────────────────────────────────
// MozambiqueMapSVG: Simplified SVG outline of Mozambique
// ──────────────────────────────────────────────

interface MozambiqueMapSVGProps {
  className?: string;
  opacity?: number;
  color?: string;
}

export function MozambiqueMapSVG({
  className = '',
  opacity = 0.08,
  color = '#10b981',
}: MozambiqueMapSVGProps) {
  return (
    <svg
      viewBox="0 0 400 200"
      className={`absolute pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Simplified Mozambique outline - a distinctive elongated shape */}
      <path
        d="M30,40 L60,30 L100,25 L140,20 L180,25 L200,35 L220,30 L250,25 L280,30 L310,35 L340,40 L350,50 L360,70 L355,90 L340,100 L320,110 L300,120 L280,130 L260,140 L240,145 L220,150 L200,155 L180,160 L160,165 L140,170 L120,175 L100,180 L80,185 L60,180 L50,170 L40,160 L35,140 L30,120 L28,100 L30,80 L32,60 Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        fillOpacity="0.3"
        strokeOpacity="0.5"
      />
      {/* Cabo Delgado province highlight */}
      <path
        d="M30,40 L60,30 L100,25 L120,30 L110,45 L90,50 L70,45 L50,45 Z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      {/* Maputo highlight */}
      <circle cx="40" cy="170" r="6" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      {/* Beira highlight */}
      <circle cx="180" cy="80" r="5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// AfricanPatternSVG: Subtle African/Mozambican geometric pattern
// ──────────────────────────────────────────────

interface AfricanPatternSVGProps {
  className?: string;
  opacity?: number;
  color?: string;
}

export function AfricanPatternSVG({
  className = '',
  opacity = 0.06,
  color = '#10b981',
}: AfricanPatternSVGProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`absolute pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Repeating geometric pattern - diamond zigzag motif */}
      <defs>
        <pattern id="african-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* Diamond shape */}
          <path d="M20,0 L40,20 L20,40 L0,20 Z" fill={color} fillOpacity="0.15" />
          {/* Inner diamond */}
          <path d="M20,8 L32,20 L20,32 L8,20 Z" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Cross lines */}
          <line x1="20" y1="0" x2="20" y2="40" stroke={color} strokeWidth="0.3" strokeOpacity="0.3" />
          <line x1="0" y1="20" x2="40" y2="20" stroke={color} strokeWidth="0.3" strokeOpacity="0.3" />
          {/* Small dots */}
          <circle cx="20" cy="20" r="1.5" fill={color} fillOpacity="0.3" />
          <circle cx="10" cy="10" r="0.8" fill={color} fillOpacity="0.2" />
          <circle cx="30" cy="30" r="0.8" fill={color} fillOpacity="0.2" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#african-pattern)" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// TechPatternSVG: Tech-themed pattern (circuits, dots, connections)
// ──────────────────────────────────────────────

interface TechPatternSVGProps {
  className?: string;
  opacity?: number;
  color?: string;
}

export function TechPatternSVG({
  className = '',
  opacity = 0.08,
  color = '#10b981',
}: TechPatternSVGProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`absolute pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="tech-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          {/* Circuit lines */}
          <line x1="0" y1="25" x2="25" y2="25" stroke={color} strokeWidth="0.5" strokeOpacity="0.4" />
          <line x1="25" y1="25" x2="25" y2="50" stroke={color} strokeWidth="0.5" strokeOpacity="0.4" />
          <line x1="25" y1="0" x2="50" y2="25" stroke={color} strokeWidth="0.4" strokeOpacity="0.3" />
          {/* Nodes / dots */}
          <circle cx="25" cy="25" r="2" fill={color} fillOpacity="0.3" />
          <circle cx="0" cy="25" r="1" fill={color} fillOpacity="0.2" />
          <circle cx="50" cy="25" r="1" fill={color} fillOpacity="0.2" />
          <circle cx="25" cy="0" r="1" fill={color} fillOpacity="0.2" />
          <circle cx="25" cy="50" r="1" fill={color} fillOpacity="0.2" />
          {/* Small connecting squares */}
          <rect x="22" y="22" width="6" height="6" fill="none" stroke={color} strokeWidth="0.3" strokeOpacity="0.2" rx="1" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#tech-pattern)" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// GradientWaveSVG: Gradient wave divider
// Emerald → yellow → red (Mozambique flag colors)
// ──────────────────────────────────────────────

interface GradientWaveSVGProps {
  className?: string;
  flip?: boolean;
  height?: number;
}

export function GradientWaveSVG({
  className = '',
  flip = false,
  height = 80,
}: GradientWaveSVGProps) {
  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }} aria-hidden="true">
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={`w-full h-full ${flip ? 'rotate-180' : ''}`}
      >
        <defs>
          <linearGradient id="mozambique-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="mozambique-gradient-reverse" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Main wave */}
        <path
          d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z"
          fill="url(#mozambique-gradient)"
          opacity="0.3"
        />
        {/* Secondary wave */}
        <path
          d="M0,80 C150,40 350,110 550,70 C750,30 950,110 1200,70 L1200,120 L0,120 Z"
          fill="url(#mozambique-gradient-reverse)"
          opacity="0.2"
        />
        {/* Thin accent line */}
        <path
          d="M0,90 C200,70 400,110 600,80 C800,50 1000,90 1200,70"
          fill="none"
          stroke="url(#mozambique-gradient)"
          strokeWidth="2"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
