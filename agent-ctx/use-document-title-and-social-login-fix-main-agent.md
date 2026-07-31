# Task: useDocumentTitle Hook & Social Login Fix

## Agent: Main Agent

## Task ID: use-document-title-and-social-login-fix

## Summary

### Task 1: Create useDocumentTitle hook and apply it to all pages

**Created:**
- `/home/z/my-project/src/hooks/use-document-title.ts` - Client-side hook that sets `document.title` dynamically with i18n support

**Applied to client component pages (directly in page.tsx):**
- `src/app/(public)/auth/page.tsx` - `useDocumentTitle('auth.login', 'Entrar')`
- `src/app/(public)/blog/page.tsx` - `useDocumentTitle('nav.blog', 'Blog')`
- `src/app/(public)/forum/page.tsx` - `useDocumentTitle('nav.forum', 'Fórum')`
- `src/app/(public)/setup/page.tsx` - `useDocumentTitle('setup.title', 'Configuração')`
- `src/app/(public)/testimonials/page.tsx` - `useDocumentTitle('home.testimonialTitle', 'Testemunhos')`
- `src/app/(public)/ref/[id]/page.tsx` - `useDocumentTitle('nav.home', 'Redirecionando...')`
- `src/app/maintenance/page.tsx` - `useDocumentTitle('maintenance.title', 'Em Manutenção')`
- `src/app/(dashboard)/admin/page.tsx` - `useDocumentTitle('admin.dashboard', 'Administração')`
- `src/app/(dashboard)/admin/ai-providers/page.tsx` - `useDocumentTitle('admin.aiProviders', 'Provedores IA')`
- `src/app/(dashboard)/admin/analytics/page.tsx` - `useDocumentTitle('admin.systemLogs', 'Analytics')`
- `src/app/(dashboard)/admin/blog/page.tsx` - `useDocumentTitle('admin.posts', 'Blog')`
- `src/app/(dashboard)/admin/categories/page.tsx` - `useDocumentTitle('admin.categories', 'Categorias')`
- `src/app/(dashboard)/admin/db-manager/page.tsx` - `useDocumentTitle('admin.dbManager', 'Base de Dados')`
- `src/app/(dashboard)/admin/notifications/page.tsx` - `useDocumentTitle('admin.sendNotification', 'Notificações')`
- `src/app/(dashboard)/admin/projects/page.tsx` - `useDocumentTitle('admin.projects', 'Projectos')`
- `src/app/(dashboard)/admin/reports/page.tsx` - `useDocumentTitle('admin.reports', 'Relatórios')`
- `src/app/(dashboard)/admin/services/page.tsx` - `useDocumentTitle('admin.services', 'Serviços')`
- `src/app/(dashboard)/admin/settings/page.tsx` - `useDocumentTitle('admin.systemSettings', 'Configurações')`
- `src/app/(dashboard)/admin/testimonials/page.tsx` - `useDocumentTitle('admin.testimonials', 'Testemunhos')`
- `src/app/(dashboard)/admin/users/page.tsx` - `useDocumentTitle('admin.users', 'Utilizadores')`
- `src/app/(dashboard)/partner/page.tsx` - `useDocumentTitle('partner.portfolio', 'Parceiro')`
- `src/app/(dashboard)/partner/ads/page.tsx` - `useDocumentTitle('ads.title', 'Anúncios')`
- `src/app/(dashboard)/partner/affiliate/page.tsx` - `useDocumentTitle('partner.affiliate', 'Afiliado')`
- `src/app/(dashboard)/partner/commissions/page.tsx` - `useDocumentTitle('partner.commissions', 'Comissões')`
- `src/app/(dashboard)/partner/withdrawals/page.tsx` - `useDocumentTitle('partner.withdrawals', 'Levantamentos')`
- `src/app/(dashboard)/user/page.tsx` - `useDocumentTitle('dashboard.profile', 'Perfil')`
- `src/app/(dashboard)/user/invoices/page.tsx` - `useDocumentTitle('dashboard.invoices', 'Facturas')`
- `src/app/(dashboard)/user/loyalty/page.tsx` - `useDocumentTitle('loyalty.title', 'Fidelidade')`
- `src/app/(dashboard)/user/notifications/page.tsx` - `useDocumentTitle('dashboard.notifications', 'Notificações')`
- `src/app/(dashboard)/user/payments/page.tsx` - `useDocumentTitle('dashboard.payments', 'Pagamentos')`
- `src/app/(dashboard)/user/quotes/page.tsx` - `useDocumentTitle('dashboard.quotes', 'Cotações')`
- `src/app/(dashboard)/user/settings/page.tsx` - `useDocumentTitle('dashboard.settings', 'Configurações')`
- `src/app/(dashboard)/user/support/page.tsx` - `useDocumentTitle('dashboard.support', 'Suporte')`

**Applied to rendered components (for server component pages):**
- `src/components/public/home-page.tsx` - `useDocumentTitle('nav.home', 'Início', true)`
- `src/components/public/about-section.tsx` - `useDocumentTitle('nav.about', 'Sobre Nós')`
- `src/components/features/contact-form-api.tsx` - `useDocumentTitle('nav.contact', 'Contacto')`
- `src/components/public/cookies-page.tsx` - `useDocumentTitle('footer.cookies', 'Cookies')`
- `src/components/public/dmca-page.tsx` - `useDocumentTitle('footer.dmca', 'DMCA')`
- `src/components/public/faq-section.tsx` - `useDocumentTitle('nav.faq', 'FAQ')`
- `src/components/public/privacy-page.tsx` - `useDocumentTitle('footer.privacy', 'Privacidade')`
- `src/components/public/projects-section.tsx` - `useDocumentTitle('nav.projects', 'Projectos')`
- `src/components/public/services-section.tsx` - `useDocumentTitle('nav.services', 'Serviços')`
- `src/components/public/terms-page.tsx` - `useDocumentTitle('footer.terms', 'Termos')`
- `src/components/admin/admin-ads-manager.tsx` - `useDocumentTitle('ads.title', 'Anúncios')`
- `src/components/admin/admin-partner-manager.tsx` - `useDocumentTitle('admin.partner', 'Parceiros')`
- `src/components/admin/admin-payments-manager.tsx` - `useDocumentTitle('admin.payments', 'Pagamentos')`
- `src/components/admin/admin-quotes-manager.tsx` - `useDocumentTitle('admin.quotes', 'Cotações')`
- `src/components/admin/admin-support-manager.tsx` - `useDocumentTitle('admin.support', 'Suporte')`
- `src/components/admin/admin-forum-manager.tsx` - `useDocumentTitle('admin.forum', 'Fórum')`

**Added metadata to server component pages:**
- `src/app/(public)/home/page.tsx` - `export const metadata = { title: 'CarsaiMz - Transformação Digital' }`
- `src/app/(public)/blog/[slug]/page.tsx` - `generateMetadata` that fetches blog post title from Firestore
- `src/app/(public)/forum/[slug]/page.tsx` - `generateMetadata` that fetches forum topic title from Firestore
- `src/app/(public)/projects/[slug]/page.tsx` - `generateMetadata` that fetches project title from Firestore
- `src/app/(public)/services/[slug]/page.tsx` - `generateMetadata` that fetches service title from Firestore

### Task 2: Fix Social Login (Google/GitHub) - redirect to Firebase handler URL

**Root cause:** The `loginWithGoogle` and `loginWithGithub` methods in `src/lib/store.ts` were falling back to `signInWithRedirect` for both `auth/popup-blocked` AND `auth/popup-closed-by-user` errors. This caused the browser to redirect to the Firebase auth handler URL when the popup was closed by the user (or when other errors like `auth/unauthorized-domain` occurred).

**Fix applied in `src/lib/store.ts`:**
- Changed the fallback condition to ONLY fall back to `signInWithRedirect` for `auth/popup-blocked` (browser genuinely blocked the popup)
- For `auth/popup-closed-by-user` (user action), the error is now re-thrown and handled by the catch block with a clear error message
- For `auth/unauthorized-domain` (config issue), the error is now re-thrown and handled with a clear error message
- This prevents the unwanted redirect to the Firebase auth handler URL

## Files Modified
- 40+ page/component files (useDocumentTitle hook)
- 1 new file (use-document-title.ts hook)
- 4 generateMetadata additions
- 1 store.ts fix (social login)
