/**
 * Carsai Mozambique — Chat Knowledge Base Builder
 *
 * Dynamically builds a rich system prompt for the AI chatbot by reading
 * real data from Firestore collections and public page content.
 *
 * This replaces the hardcoded CARSAI_CONTEXT with a living knowledge base
 * that automatically updates when the database changes.
 *
 * Architecture:
 *   1. Static knowledge (company info, rules) — always present
 *   2. Dynamic knowledge (services, projects, posts, testimonials) — fetched from Firestore
 *   3. Skills — structured actions the chatbot can guide users through
 *
 * Cache: 5-minute TTL to avoid excessive Firestore reads on the Spark plan.
 */

import { getAdminFirestore } from '@/lib/firebase-admin'
import { checkFirebaseAdmin } from '@/lib/db-helpers'

// ── Cache ──

let cachedKnowledge = ''
let knowledgeCacheTime = 0
const KNOWLEDGE_CACHE_TTL = 5 * 60_000 // 5 minutes

/**
 * Invalidate the knowledge cache.
 * Called when content is updated via admin APIs.
 */
export function invalidateKnowledgeCache() {
  cachedKnowledge = ''
  knowledgeCacheTime = 0
}

// ── Types ──

interface ServiceData {
  id: string
  name?: string          // Legacy field from old client-seed
  title?: string
  slug?: string
  description?: string
  basePrice?: number | null
  price?: string | number | null  // Legacy field from old client-seed
  features?: string[]
  isPublished?: boolean
  isActive?: boolean     // Legacy field — should not be used for filtering
  isFeatured?: boolean
  featured?: boolean     // Legacy field from old client-seed
  titleI18n?: string
  descriptionI18n?: string
  [key: string]: any
}

interface ProjectData {
  id: string
  name?: string
  title?: string
  slug?: string
  description?: string
  technologies?: string[]
  url?: string
  imageUrl?: string
  category?: string
  isFeatured?: boolean
  [key: string]: any
}

interface PostData {
  id: string
  title?: string
  slug?: string
  excerpt?: string
  category?: string
  tags?: string[]
  isPublished?: boolean
  [key: string]: any
}

interface TestimonialData {
  id: string
  name?: string
  author?: string
  content?: string
  rating?: number
  company?: string
  role?: string
  [key: string]: any
}

interface FAQData {
  id: string
  question?: string
  answer?: string
  [key: string]: any
}

interface ForumTopicData {
  id: string
  title?: string
  slug?: string
  category?: string
  author?: string
  repliesCount?: number
  [key: string]: any
}

// ── Helpers ──

/**
 * Safely fetch a Firestore collection, returning [] on any error.
 */
async function safeFetchCollection<T = Record<string, any>>(
  collectionName: string,
  limitCount: number = 50
): Promise<T[]> {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) return []

    const db = getAdminFirestore()
    if (!db) return []

    const snap = await db.collection(collectionName).limit(limitCount).get()
    if (snap.empty) return []

    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T)
  } catch {
    return []
  }
}

/**
 * Safely fetch a single Firestore document by ID.
 */
async function safeFetchDoc<T = Record<string, any>>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) return null

    const db = getAdminFirestore()
    if (!db) return null

    const snap = await db.collection(collectionName).doc(docId).get()
    if (!snap.exists) return null
    return { id: snap.id, ...snap.data() } as T
  } catch {
    return null
  }
}

/**
 * Truncate a string to a maximum length.
 */
function truncate(str: string, maxLen: number = 200): string {
  if (!str) return ''
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}

/**
 * Safely extract a string value from a field that might be i18n-encoded.
 * Some fields use titleI18n/contentI18n format with language keys.
 */
function extractText(value: any, fallback: string = ''): string {
  if (!value) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    // Try common language keys
    return value['pt-pt'] || value['en-us'] || value['pt-br'] || value['fr-fr'] || Object.values(value)[0] as string || fallback
  }
  return fallback
}

// ── Static Knowledge ──

function buildStaticKnowledge(): string {
  return `=== COMPANY INFORMATION ===
- Company: Carsai Mozambique
- Tagline: Soluções Digitais e Hospedagem Web Gratuita
- Email: carsaimozambique@gmail.com, suporte.carsaimz@gmail.com
- Phone/M-Pesa: +258 847545020, +258 874512581, +258 84246463, +258 835020143
- WhatsApp: https://wa.me/258847545020
- Address: Montepuez, Cabo Delgado, Mozambique
- Website: https://carsai.mz
- GitHub: https://github.com/carsaimz
- Social Media: @carsaimz on all platforms

=== PAYMENT & CURRENCY ===
- Currency: Mozambican Metical (MT / MZN)
- USD also accepted for international clients
- Payment methods: M-Pesa (mobile money), bank transfer (BCI, Millennium BIM), international credit/debit cards
- M-Pesa numbers: 847545020, 874512581, 84246463, 835020143

=== IMPORTANT RULES ===
1. Always respond in the same language the user writes in (Portuguese, English, French, Makhuwa, Swahili, etc.)
2. Be helpful, friendly, and concise — aim for 2-3 paragraphs max unless more detail is requested
3. Never invent or guess information — if you don't know, say so and suggest contacting us directly
4. When asked about pricing, mention base prices from the services list and that FREE hosting is available
5. Always mention our FREE hosting offering (Apache shared hosting by ifastnet/byet) when relevant
6. Development services start at MT 5,000 — no service is completely free except web hosting
7. The FREE hosting is provided by ifastnet/byet (Apache shared hosting), not by Carsai directly
8. For detailed quotes, direct users to contact us via email or WhatsApp
9. If a user asks about a specific project, service, or blog post, reference the information from the database below
10. If a user asks about something not covered, suggest they contact us for more information`
}

// ── Dynamic Knowledge Builders ──

async function buildServicesKnowledge(): Promise<string> {
  const services = await safeFetchCollection<ServiceData>('services', 50)
  if (services.length === 0) return ''

  // Filter: only include published services.
  // A document is considered "published" if isPublished is explicitly true,
  // or if the field is missing/undefined (legacy data — treat as published).
  const publishedServices = services.filter(s => {
    if (s.isPublished !== undefined && s.isPublished !== null) {
      return s.isPublished === true
    }
    // Legacy documents without isPublished — treat as published
    return !!(s.title || s.name)
  })
  if (publishedServices.length === 0) return ''

  const lines = ['=== SERVICES (from database) ===']
  for (const svc of publishedServices) {
    const name = extractText(svc.title || svc.name, 'Unnamed Service')
    const desc = truncate(extractText(svc.description, ''), 150)
    const priceVal = svc.basePrice || (typeof svc.price === 'number' ? svc.price : null)
    const price = priceVal ? ` — Price: MT ${Number(priceVal).toLocaleString()}` : ''
    const slug = svc.slug ? ` (slug: ${svc.slug})` : ''
    const features = svc.features && Array.isArray(svc.features) && svc.features.length > 0
      ? ` — Features: ${svc.features.join(', ')}`
      : ''
    const featured = (svc.isFeatured || svc.featured) ? ' [FEATURED]' : ''
    lines.push(`- ${name}${slug}${featured}: ${desc}${price}${features}`)
  }
  return lines.join('\n')
}

async function buildProjectsKnowledge(): Promise<string> {
  const projects = await safeFetchCollection<ProjectData>('projects', 30)
  if (projects.length === 0) return ''

  const lines = ['=== PORTFOLIO PROJECTS (from database) ===']
  for (const proj of projects) {
    const name = extractText(proj.name || proj.title, 'Unnamed Project')
    const desc = truncate(extractText(proj.description, ''), 120)
    const tech = proj.technologies && Array.isArray(proj.technologies) && proj.technologies.length > 0
      ? ` — Tech: ${proj.technologies.join(', ')}`
      : ''
    const url = proj.url ? ` — URL: ${proj.url}` : ''
    const slug = proj.slug ? ` (slug: ${proj.slug})` : ''
    const featured = proj.isFeatured ? ' [FEATURED]' : ''
    lines.push(`- ${name}${slug}${featured}: ${desc}${tech}${url}`)
  }
  return lines.join('\n')
}

async function buildBlogKnowledge(): Promise<string> {
  const posts = await safeFetchCollection<PostData>('posts', 20)
  if (posts.length === 0) return ''

  // Only include published posts
  const published = posts.filter(p => p.isPublished !== false)
  if (published.length === 0) return ''

  const lines = ['=== BLOG POSTS (from database) ===']
  for (const post of published) {
    const title = extractText(post.title, 'Untitled Post')
    const excerpt = truncate(extractText(post.excerpt || '', ''), 100)
    const slug = post.slug ? ` (slug: ${post.slug})` : ''
    const tags = post.tags && Array.isArray(post.tags) && post.tags.length > 0
      ? ` — Tags: ${post.tags.join(', ')}`
      : ''
    lines.push(`- ${title}${slug}: ${excerpt}${tags}`)
  }
  return lines.join('\n')
}

async function buildTestimonialsKnowledge(): Promise<string> {
  const testimonials = await safeFetchCollection<TestimonialData>('testimonials', 10)
  if (testimonials.length === 0) return ''

  const lines = ['=== CUSTOMER TESTIMONIALS (from database) ===']
  for (const t of testimonials) {
    const author = t.name || t.author || 'Anonymous'
    const content = truncate(extractText(t.content || '', ''), 120)
    const company = t.company ? ` (${t.company})` : ''
    const role = t.role ? ` — ${t.role}` : ''
    const rating = t.rating ? ` — Rating: ${t.rating}/5` : ''
    lines.push(`- "${content}" — ${author}${company}${role}${rating}`)
  }
  return lines.join('\n')
}

async function buildFAQKnowledge(): Promise<string> {
  // FAQ might be stored in settings or a dedicated collection
  const faqs = await safeFetchCollection<FAQData>('settings', 50)
  const faqSettings = faqs.filter(f => f.id?.startsWith('faq') || f.question)

  if (faqSettings.length === 0) {
    // Try alternative collection name
    const altFaqs = await safeFetchCollection<FAQData>('faq', 20)
    if (altFaqs.length === 0) {
      // Provide default FAQ
      return `=== FREQUENTLY ASKED QUESTIONS ===
- Q: What is the FREE hosting? A: We offer Apache shared hosting provided by ifastnet/byet at no cost. Includes cPanel, MySQL, PHP, and email.
- Q: How much does a website cost? A: Custom websites start at MT 5,000. The final price depends on complexity, features, and design requirements.
- Q: What payment methods do you accept? A: We accept M-Pesa, bank transfers (BCI, Millennium BIM), and international credit/debit cards.
- Q: How long does it take to build a website? A: Simple websites take 3-7 days. Complex projects may take 2-4 weeks depending on requirements.
- Q: Do you offer domain registration? A: Yes, we register .mz, .com, .net, .org, and other domain extensions.
- Q: Is SSL included? A: Yes, all our hosting plans include free Let's Encrypt SSL certificates.
- Q: Can I migrate my existing website? A: Yes, we offer free migration assistance for websites moving to our hosting.
- Q: Do you offer mobile app development? A: Yes, we develop Android and iOS apps starting from MT 15,000.`
    }

    const lines = ['=== FREQUENTLY ASKED QUESTIONS (from database) ===']
    for (const faq of altFaqs) {
      const q = extractText(faq.question, '')
      const a = truncate(extractText(faq.answer, ''), 150)
      if (q && a) lines.push(`- Q: ${q} A: ${a}`)
    }
    return lines.join('\n')
  }

  const lines = ['=== FREQUENTLY ASKED QUESTIONS (from database) ===']
  for (const faq of faqSettings) {
    const q = extractText(faq.question, '')
    const a = truncate(extractText(faq.answer, ''), 150)
    if (q && a) lines.push(`- Q: ${q} A: ${a}`)
  }
  return lines.join('\n')
}

async function buildForumKnowledge(): Promise<string> {
  const topics = await safeFetchCollection<ForumTopicData>('forum_topics', 15)
  if (topics.length === 0) return ''

  const lines = ['=== FORUM TOPICS (from database) ===']
  for (const topic of topics) {
    const title = extractText(topic.title, 'Untitled Topic')
    const slug = topic.slug ? ` (slug: ${topic.slug})` : ''
    const replies = topic.repliesCount ? ` — ${topic.repliesCount} replies` : ''
    const author = topic.author ? ` by ${topic.author}` : ''
    lines.push(`- ${title}${slug}${author}${replies}`)
  }
  return lines.join('\n')
}

// ── Skills System ──

function buildSkillsKnowledge(): string {
  return `=== SKILLS / ACTIONS ===
You can guide users through these actions. When a user's intent matches a skill, provide helpful information AND suggest the next step:

1. GET_QUOTE — User wants a price quote for a service
   → Ask what service they need (website, app, hosting, domain, SEO, design)
   → Provide base price from the services list
   → Suggest contacting via WhatsApp or email for a detailed quote

2. CHECK_HOSTING — User asks about hosting
   → Explain the FREE hosting (Apache by ifastnet/byet) with features
   → Mention paid hosting options for more demanding needs
   → Direct to /services/hosting for details

3. START_PROJECT — User wants to start a project
   → Ask about the type (website, app, e-commerce, etc.)
   → Suggest scheduling a consultation
   → Provide WhatsApp link: https://wa.me/258847545020

4. READ_BLOG — User wants to learn about a topic
   → Reference relevant blog posts from the database
   → Suggest visiting /blog for more articles

5. GET_SUPPORT — User needs help or has a problem
   → Provide email: suporte.carsaimz@gmail.com
   → Provide WhatsApp: https://wa.me/258847545020
   → Mention the support ticket system for registered users

6. LEARN_ABOUT — User wants to know about Carsai
   → Share company info, services, and testimonials
   → Suggest visiting /about for full details

7. CAREER_OR_PARTNERSHIP — User wants to work with or partner with Carsai
   → Direct to email: carsaimozambique@gmail.com
   → Mention GitHub: https://github.com/carsaimz

8. DOMAIN_CHECK — User wants to register a domain
   → Explain we offer .mz, .com, .net, .org domains
   → Suggest contacting us to check availability
   → Mention domain registration starts at MT 1,500/year for .mz`
}

// ── Main Builder ──

/**
 * Build the complete knowledge base for the chatbot.
 * Combines static knowledge with dynamic data from Firestore.
 * Results are cached for 5 minutes.
 */
export async function buildKnowledgeBase(): Promise<string> {
  const now = Date.now()
  if (cachedKnowledge && (now - knowledgeCacheTime) < KNOWLEDGE_CACHE_TTL) {
    return cachedKnowledge
  }

  try {
    // Build all knowledge sections in parallel
    const [
      services,
      projects,
      blog,
      testimonials,
      faq,
      forum,
    ] = await Promise.all([
      buildServicesKnowledge(),
      buildProjectsKnowledge(),
      buildBlogKnowledge(),
      buildTestimonialsKnowledge(),
      buildFAQKnowledge(),
      buildForumKnowledge(),
    ])

    // Combine all sections
    const sections = [
      buildStaticKnowledge(),
      services,
      projects,
      blog,
      testimonials,
      faq,
      forum,
      buildSkillsKnowledge(),
    ].filter(s => s.length > 0)

    const knowledge = sections.join('\n\n')

    cachedKnowledge = knowledge
    knowledgeCacheTime = now

    console.log(`[Knowledge] Built knowledge base (${knowledge.length} chars)`)
    return knowledge
  } catch (error) {
    console.warn('[Knowledge] Failed to build knowledge base:', error)

    // Fallback to static knowledge only
    const fallback = buildStaticKnowledge() + '\n\n' + buildSkillsKnowledge()
    cachedKnowledge = fallback
    knowledgeCacheTime = now
    return fallback
  }
}
