'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Github,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';
import { GITHUB_URL } from '@/lib/client-config';
import { apiFetch } from '@/lib/api-fetch';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterStatus('loading');
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
        setTimeout(() => setNewsletterStatus('idle'), 3000);
      } else {
        setNewsletterStatus('error');
        setTimeout(() => setNewsletterStatus('idle'), 3000);
      }
    } catch {
      setNewsletterStatus('error');
      setTimeout(() => setNewsletterStatus('idle'), 3000);
    }
  };

  const socialLinks = [
    { icon: MessageCircle, label: t('footer.socialWhatsapp'), href: 'https://wa.me/258847545020', color: 'hover:text-green-400' },
    { icon: Facebook, label: t('footer.socialFacebook'), href: 'https://facebook.com/carsaimz', color: 'hover:text-blue-400' },
    { icon: Instagram, label: t('footer.socialInstagram'), href: 'https://instagram.com/carsaimz', color: 'hover:text-pink-400' },
    { icon: Globe, label: t('footer.socialTiktok'), href: 'https://tiktok.com/@carsaimz', color: 'hover:text-red-400' },
    { icon: Youtube, label: t('footer.socialYoutube'), href: 'https://youtube.com/@carsaimz', color: 'hover:text-red-500' },
    { icon: MessageCircle, label: t('footer.socialDiscord'), href: 'https://discord.gg/carsaimz', color: 'hover:text-indigo-400' },
    { icon: Github, label: t('footer.socialGithub'), href: GITHUB_URL, color: 'hover:text-gray-300' },
  ];

  return (
    <footer className="bg-emerald-900 text-emerald-100 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <img src="/logo.png" alt="CarsaiMZ" className="h-10 w-auto brightness-200" />
            </div>
            <p className="text-emerald-200 text-sm leading-relaxed mb-3">
              {t('footer.companyDescription')}
            </p>
            <p className="text-emerald-300 text-xs italic">
              {t('footer.onlineOperation')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('footer.links')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#services" className="hover:text-yellow-400 transition-colors">
                  {t('nav.services')}
                </a>
              </li>
              <li>
                <a href="#projects" className="hover:text-yellow-400 transition-colors">
                  {t('nav.projects')}
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-yellow-400 transition-colors">
                  {t('nav.about')}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-yellow-400 transition-colors">
                  {t('nav.contact')}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-yellow-400 transition-colors">
                  {t('nav.faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('footer.contactInfo')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t('footer.addressValue')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t('footer.phoneValue')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                <a href="mailto:carsaimozambique@gmail.com" className="hover:text-yellow-400 transition-colors">
                  carsaimozambique@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                <a href="mailto:suporte.carsaimz@gmail.com" className="hover:text-yellow-400 transition-colors">
                  suporte.carsaimz@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('footer.newsletter')}
            </h4>
            <p className="text-emerald-200 text-sm mb-3">
              {t('footer.followUs')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 mb-4">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t('footer.newsletterPlaceholder')}
                required
                disabled={newsletterStatus === 'loading'}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-800 border border-emerald-600 text-emerald-100 text-sm placeholder:text-emerald-400 focus:outline-none focus:border-yellow-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="px-4 py-2 rounded-lg bg-yellow-400 text-emerald-900 font-semibold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {newsletterStatus === 'loading' ? '...' : t('footer.newsletterSubscribe')}
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="text-yellow-400 text-xs mb-3">{t('footer.newsletterSuccess')}</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-red-400 text-xs mb-3">{t('newsletter.subscribeError')}</p>
            )}

            {/* Social Media Icons */}
            <h4 className="font-semibold text-white mb-2 text-sm">
              {t('footer.social')}
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`text-emerald-300 transition-colors ${social.color}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-emerald-700 mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-emerald-300">
          <p>{t('footer.copyright', { year: String(year) })}</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-yellow-400 transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="/terms" className="hover:text-yellow-400 transition-colors">
              {t('footer.terms')}
            </a>
            <a href="/cookies" className="hover:text-yellow-400 transition-colors">
              {t('footer.cookies')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
