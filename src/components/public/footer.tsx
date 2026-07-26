'use client';

import { useLanguage } from '@/contexts/language-context';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-emerald-900 text-emerald-100 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">
              Carsai <span className="text-yellow-400">Moçambique</span>
            </h3>
            <p className="text-emerald-200 text-sm leading-relaxed">
              {t('footer.companyDescription')}
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
            <ul className="space-y-2 text-sm">
              <li>Av. 24 de Julho, Maputo</li>
              <li>+258 84 123 4567</li>
              <li>info@carsai.mz</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('footer.newsletter')}
            </h4>
            <p className="text-emerald-200 text-sm mb-3">
              {t('footer.followUs')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.newsletterPlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-800 border border-emerald-600 text-emerald-100 text-sm placeholder:text-emerald-400 focus:outline-none focus:border-yellow-400"
              />
              <button className="px-4 py-2 rounded-lg bg-yellow-400 text-emerald-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
                {t('footer.newsletterSubscribe')}
              </button>
            </div>
          </div>
        </div>

        <Separator className="bg-emerald-700 mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-emerald-300">
          <p>{t('footer.copyright', { year: String(year) })}</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-yellow-400 transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="#" className="hover:text-yellow-400 transition-colors">
              {t('footer.terms')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
