# Task: Update Company Information and Add FAQ Questions

## Summary
Successfully updated all company information throughout the Carsai Mozambique platform and added 26 FAQ questions across 5 categories.

## Changes Made

### 1. Seed Data (`src/lib/seed-data.ts`)
- Updated all 5 settings → 16 settings with real company info
- Added: support_email, developer_email, ceo_name, developer_name, social media (7 platforms)
- company_name: "Carsai Moçambique"
- contact_email: carsaimozambique@gmail.com
- contact_phone: 847545020 / 874512581 / 84246463 / 835020143
- contact_address: Montepuez, Cabo Delgado, Moçambique (operação online)
- Database re-seeded successfully with 16 settings

### 2. Footer Component (`src/components/public/footer.tsx`)
- Replaced hardcoded address/phone/email with i18n keys (footer.addressValue, footer.phoneValue)
- Added social media icons (WhatsApp, Facebook, Instagram, TikTok, YouTube, Discord, GitHub)
- Added "Operação online — sem sede física" note
- Made newsletter form functional with POST to /api/newsletter

### 3. Contact Section (`src/components/public/contact-section.tsx`)
- Replaced hardcoded Maputo address → Montepuez, Cabo Delgado
- Replaced hardcoded phone numbers → real 4 phone numbers
- Replaced hardcoded email → both carsaimozambique@gmail.com and suporte.carsaimz@gmail.com
- Added social media card with links to all 7 platforms
- Added "Operação online — sem sede física" note
- Removed map placeholder (no physical office)

### 4. About Section (`src/components/public/about-section.tsx`)
- Replaced fake 6-member team → Carimo Saide Mpinda (CEO & Founder)
- Updated history stats: Team size "1", Location "Montepuez"
- All team info uses i18n keys (about.teamMemberCeo, etc.)

### 5. FAQ Section (`src/components/public/faq-section.tsx`)
- Added 26 FAQ questions (up from 5) across 5 categories:
  - Services (8): web dev, mobile, UI/UX, cloud, pricing, maintenance
  - Payment (5): methods, M-Pesa, payment plans, refund, invoices
  - Support (4): contact, hours, tickets, response time
  - Partner (4): becoming partner, benefits, commissions, payments
  - General (5): free model, location, team, tech, security + 2 more (custom projects, tracking)
- Added category filter buttons with "All" option
- Added "general" category with proper i18n key

### 6. AI Chat Assistant (`src/components/features/ai-chat-assistant.tsx`)
- Replaced hardcoded "DB Connected" → t('chat.dbConnected')
- Replaced hardcoded "messages in memory" → t('chat.messagesInMemory')
- Replaced hardcoded "Perguntas frequentes" → t('chat.frequentQuestions')
- Replaced hardcoded "Powered by Carsai AI..." → t('chat.poweredBy')

### 7. Home Hero (`src/components/public/home-hero.tsx`)
- Replaced hardcoded badge text → t('home.heroBadge')

### 8. Translation Files (7 languages)
- **pt-pt**: Full update with all FAQ questions, company info, social keys, legal references updated
- **en-us**: Full update with all FAQ questions, company info, social keys, legal references updated
- **pt-br**: Full update with all FAQ questions, company info, social keys, legal references updated
- **fr-fr**: Footer, contact, about, chat, hero keys added; legal references updated (privacy@carsai.mz → suporte.carsaimz@gmail.com, Av. 24 de Julho → Montepuez, Carlos Silva → Carimo Saide Mpinda)
- **es-es**: Same updates as fr-fr
- **zh-cn**: Same updates as fr-fr
- **de-de**: Same updates as fr-fr

### Legal References Updated (all 7 files)
- privacy@carsai.mz → suporte.carsaimz@gmail.com
- Av. 24 de Julho, 1234, Maputo → removed/updated to Montepuez
- +258 21 000 000 → 847545020 / 874512581 / 84246463 / 835020143
- Carlos Silva, Director → Carimo Saide Mpinda, CEO & Fundador

## Lint Status: ✅ Passing (no errors)
## Database: ✅ Re-seeded with 16 settings
