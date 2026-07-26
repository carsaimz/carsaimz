'use client';

import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NewsletterForm } from '@/components/features/newsletter-form';

import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Footer quick links (URL-based)
// ──────────────────────────────────────────────

interface FooterLink {
  path: string;
  labelKey: string;
}

const QUICK_LINKS: FooterLink[] = [
  { path: '/services', labelKey: 'nav.services' },
  { path: '/projects', labelKey: 'nav.projects' },
  { path: '/blog', labelKey: 'nav.blog' },
  { path: '/forum', labelKey: 'nav.forum' },
  { path: '/about', labelKey: 'nav.about' || 'about.title' },
  { path: '/faq', labelKey: 'nav.faq' || 'faq.title' },
];

const LEGAL_LINKS: FooterLink[] = [
  { path: '/privacy', labelKey: 'footer.privacy' },
  { path: '/terms', labelKey: 'footer.terms' },
  { path: '/cookies', labelKey: 'footer.cookies' },
];

// ──────────────────────────────────────────────
// Footer Component
// ──────────────────────────────────────────────

export function PublicFooter({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <footer className={`border-t bg-background ${className || ''}`}>
      <div className="container mx-auto px-4 py-8">
        {/* ── Main Footer Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="CarsaiMZ" className="h-10 w-auto" />
              <span className="font-bold text-lg">Carsai</span>
              <span className="text-muted-foreground">Moçambique</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('footer.companyDescription')}
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="size-8" aria-label={t('footer.socialFacebook')}>
                <Facebook className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" aria-label={t('footer.socialInstagram')}>
                <Instagram className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" aria-label={t('footer.socialTwitter')}>
                <Twitter className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" aria-label={t('footer.socialLinkedIn')}>
                <Linkedin className="size-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">{t('footer.links')}</h3>
            <nav className="flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">{t('footer.contactInfo')}</h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 mt-0.5" />
                <span>{t('footer.address')}: Av. Julius Nyerere, Maputo</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <span>info@carsai.mz</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <span>+258 21 000 000</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <NewsletterForm />
        </div>

        {/* ── Separator ── */}
        <Separator className="my-6" />

        {/* ── Bottom Row ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year: '2026' })}</p>
          <nav className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
