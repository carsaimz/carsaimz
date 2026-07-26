'use client';

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

import { useAppStore, type AppView } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Footer quick links
// ──────────────────────────────────────────────

interface FooterLink {
  view: AppView;
  labelKey: string;
}

const QUICK_LINKS: FooterLink[] = [
  { view: 'services', labelKey: 'nav.services' },
  { view: 'projects', labelKey: 'nav.projects' },
  { view: 'blog', labelKey: 'nav.blog' },
  { view: 'forum', labelKey: 'nav.forum' },
];

const LEGAL_LINKS: FooterLink[] = [
  { view: 'home', labelKey: 'footer.privacy' },
  { view: 'home', labelKey: 'footer.terms' },
  { view: 'home', labelKey: 'footer.cookies' },
];

// ──────────────────────────────────────────────
// Footer Component
// ──────────────────────────────────────────────

export function Footer({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { setCurrentView } = useAppStore();

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                <Button
                  key={link.view + link.labelKey}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-sm text-muted-foreground hover:text-foreground h-auto py-1"
                  onClick={() => handleNavClick(link.view)}
                >
                  {t(link.labelKey)}
                </Button>
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
              <Button
                key={link.labelKey}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground h-auto py-0"
                onClick={() => handleNavClick(link.view)}
              >
                {t(link.labelKey)}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
