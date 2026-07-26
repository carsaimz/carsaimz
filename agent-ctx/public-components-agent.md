# Carsai Mozambique - Public Module Components

## Task Summary
Created all 8+ public-facing module components for the Carsai Mozambique platform. Each component is a 'use client' React component that uses shadcn/ui, Lucide icons, framer-motion animations, Tailwind CSS (emerald/green Mozambique branding), `useLanguage()` for translations, and is responsive (mobile-first).

## Files Created

### `/src/components/public/home-hero.tsx`
- Hero section with emerald gradient background
- Mozambique flag stripe accent at top
- Decorative background pattern with blurred colored circles
- Title: "Carsai Moçambique" with yellow accent
- Animated subtitle from translations
- CTA buttons: "Get Started" → services view, "View Services" → projects view
- Stats row: 4 cards (Projects, Clients, Years, Support)
- Framer-motion staggered animations

### `/src/components/public/services-section.tsx`
- Fetches from `/api/services` with fallback data
- Loading skeleton state
- 3-column grid (responsive)
- Each card: icon (mapped from Lucide), title, description, base price (MT format)
- "Learn More" button using `setCurrentView`
- Featured badge for featured services
- Emerald hover effects on icons

### `/src/components/public/projects-section.tsx`
- Fetches from `/api/projects` with fallback data
- Loading skeleton state
- Filter by category/client using Select component
- 3-column grid (responsive)
- Each card: gradient placeholder image, title, client, description, tech badges
- Demo URL link
- Featured badge

### `/src/components/public/testimonials-section.tsx`
- Fetches from `/api/testimonials` (new API route created)
- Custom carousel with prev/next buttons and dot indicators
- Star rating display (filled/unfilled stars)
- Avatar with initials fallback
- Name and company display
- Animated transitions between testimonials

### `/src/components/public/about-section.tsx`
- Mission card (emerald themed) with Target icon
- Vision card (teal themed) with Eye icon
- Values grid: Innovation, Integrity, Excellence, Community
- Company history stats: Founded, Team Members, HQ Location, Projects
- Team section with 6 members, Avatar placeholders with initials
- Separators between sections

### `/src/components/public/contact-section.tsx`
- Contact form: name, email, subject, message fields
- Loading spinner on submit, success state with animation
- Office info card: address (Maputo), phone, email, hours
- Map placeholder with SVG visual and Maputo indication
- Emerald-themed focus rings on inputs

### `/src/components/public/faq-section.tsx`
- 5 FAQ items from translations (services, payment, support, partner categories)
- Search/filter functionality
- shadcn/ui Accordion component
- Category badges on each question
- "No results" message when search yields nothing

### `/src/components/public/home-page.tsx`
- Assembles all sections: Hero → Services → Projects → Testimonials → About → Contact → FAQ
- Uses React fragment (layout provides Footer)
- No duplicate providers (layout provides LanguageProvider, AppProvider)

### `/src/components/public/footer.tsx` (bonus)
- Emerald-themed footer with Mozambique branding
- 4-column layout: Brand, Links, Contact, Newsletter
- Yellow subscribe button
- Copyright with dynamic year

## Additional Changes

### `/src/app/api/testimonials/route.ts` (new)
- GET endpoint for fetching published testimonials from Prisma
- Ordered by createdAt descending

### `/src/lib/store.ts` (modified)
- Added `'about'` and `'faq'` to AppView type union

### `/src/app/page.tsx` (modified)
- Simplified to just render `<HomePage />`
- No duplicate providers since layout wraps with LanguageProvider and AppProvider

## Database
- Seeded via `/api/seed` endpoint
- 6 services, 6 projects, 4 testimonials, 3 users, blog posts, forum topics

## All checks passing
- `bun run lint` ✅ (0 errors, 0 warnings)
- Dev server compiling successfully ✅
- All API endpoints returning data ✅
- Page renders with all sections ✅
