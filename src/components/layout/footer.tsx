'use client';

import {
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWhatsapp,
  faFacebookF,
  faInstagram,
  faTiktok,
  faDiscord,
  faYoutube,
  faGithub,
} from '@fortawesome/free-brands-svg-icons';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NewsletterForm } from '@/components/features/newsletter-form';

import { useAppStore, type AppView } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { GITHUB_URL } from '@/lib/client-config';

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
// Social links (FontAwesome brand icons)
// ──────────────────────────────────────────────

const SOCIAL_LINKS = [
  { icon: faWhatsapp, label: 'WhatsApp', href: 'https://wa.me/258847545020' },
  { icon: faFacebookF, label: 'Facebook', href: 'https://facebook.com/carsaimz' },
  { icon: faInstagram, label: 'Instagram', href: 'https://instagram.com/carsaimz' },
  { icon: faTiktok, label: 'TikTok', href: 'https://tiktok.com/@carsaimz' },
  { icon: faDiscord, label: 'Discord', href: 'https://discord.gg/carsaimz' },
  { icon: faYoutube, label: 'YouTube', href: 'https://youtube.com/@carsaimz' },
  { icon: faGithub, label: 'GitHub', href: GITHUB_URL },
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
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('footer.companyDescription')}
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <Button variant="ghost" size="icon" className="size-8">
                    <FontAwesomeIcon icon={social.icon} className="size-4" />
                  </Button>
                </a>
              ))}
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
                <span>{t('footer.address')}: Montepuez, Cabo Delgado, Mozambique</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <span>carsaimozambique@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <span>847545020 / 874512581</span>
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
