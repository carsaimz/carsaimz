/**
 * Carsai Mozambique — SEO Head Component
 *
 * A reusable component for adding page-specific structured data (JSON-LD)
 * to any page. Drop it into a page component and it will inject the
 * appropriate <script type="application/ld+json"> tags into the DOM.
 *
 * Usage examples:
 *
 *   // Product / Service page
 *   <SeoHead jsonLd={[{ "@type": "Product", name: "Web App", ... }]} />
 *
 *   // Blog post page
 *   <SeoHead jsonLd={[{ "@type": "BlogPosting", headline: "My Post", ... }]} />
 *
 *   // Breadcrumb
 *   <SeoHead jsonLd={[{ "@type": "BreadcrumbList", ... }]} />
 *
 *   // Multiple structured data blocks
 *   <SeoHead jsonLd={[breadcrumbLd, blogPostingLd]} />
 *
 * This component renders nothing visible — it only injects JSON-LD scripts.
 */

'use client'

import { SITE_URL } from '@/lib/client-config'

// ─── Types ───

/** A single JSON-LD structured data object (must include @type). */
export interface JsonLdData {
  '@type': string
  '@context'?: string
  [key: string]: any
}

export interface SeoHeadProps {
  /**
   * One or more JSON-LD structured data objects to inject.
   * Each object must have at least `@type`.
   * `@context` defaults to "https://schema.org" if not provided.
   */
  jsonLd: JsonLdData | JsonLdData[]

  /**
   * Optional canonical URL override for this page.
   * If provided, a <link rel="canonical"> tag is injected.
   */
  canonicalUrl?: string

  /**
   * Optional noindex directive — prevents search engines from indexing this page.
   * Useful for thank-you pages, search results, etc.
   */
  noindex?: boolean
}

// ─── Helper: Normalize a single JSON-LD object ───

function normalizeJsonLd(data: JsonLdData): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    ...data,
  }
}

// ─── Component ───

export function SeoHead({ jsonLd, canonicalUrl, noindex }: SeoHeadProps) {
  const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd]

  return (
    <>
      {/* Canonical URL */}
      {canonicalUrl && (
        <link rel="canonical" href={canonicalUrl} />
      )}

      {/* Noindex directive */}
      {noindex && (
        <meta name="robots" content="noindex, nofollow" />
      )}

      {/* JSON-LD Structured Data */}
      {items.map((data, index) => (
        <script
          key={`jsonld-${data['@type']}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(normalizeJsonLd(data)),
          }}
        />
      ))}
    </>
  )
}

// ─── Pre-built JSON-LD builders ───
// These helpers make it easy to create common structured data types
// without having to remember the full schema.org spec.

/**
 * Build a BreadcrumbList JSON-LD.
 *
 * Usage:
 *   <SeoHead jsonLd={SeoHead.breadcrumb([
 *     { name: 'Home', path: '/' },
 *     { name: 'Services', path: '/services' },
 *     { name: 'Web Development', path: '/services/web-development' },
 *   ])} />
 */
SeoHead.breadcrumb = function breadcrumb(
  items: Array<{ name: string; path: string }>,
): JsonLdData {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

/**
 * Build a BlogPosting JSON-LD.
 *
 * Usage:
 *   <SeoHead jsonLd={SeoHead.blogPost({
 *     title: 'My Blog Post',
 *     description: 'A summary of the post',
 *     slug: 'my-blog-post',
 *     datePublished: '2024-01-15',
 *     dateModified: '2024-01-20',
 *     authorName: 'Carsai Mozambique',
 *     imageUrl: '/images/blog/my-post.jpg',
 *   })} />
 */
SeoHead.blogPost = function blogPost({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  authorName = 'Carsai Mozambique',
  imageUrl,
}: {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified?: string
  authorName?: string
  imageUrl?: string
}): JsonLdData {
  return {
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Carsai Mozambique',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`,
      },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
  }
}

/**
 * Build a Service JSON-LD.
 *
 * Usage:
 *   <SeoHead jsonLd={SeoHead.service({
 *     name: 'Web Development',
 *     description: 'Custom web applications built with modern technologies',
 *     slug: 'web-development',
 *     price: '50000',
 *     priceCurrency: 'MZN',
 *   })} />
 */
SeoHead.service = function service({
  name,
  description,
  slug,
  price,
  priceCurrency = 'MZN',
}: {
  name: string
  description: string
  slug: string
  price?: string
  priceCurrency?: string
}): JsonLdData {
  return {
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}/services/${slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Carsai Mozambique',
      url: SITE_URL,
    },
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency,
        availability: 'https://schema.org/InStock',
      },
    }),
  }
}

/**
 * Build a CreativeWork / Project JSON-LD.
 *
 * Usage:
 *   <SeoHead jsonLd={SeoHead.project({
 *     name: 'E-Commerce Platform',
 *     description: 'A modern e-commerce platform for Mozambican businesses',
 *     slug: 'e-commerce-platform',
 *     clientName: 'Example Corp',
 *     technologies: ['Next.js', 'TypeScript', 'Firebase'],
 *     imageUrl: '/images/projects/ecommerce.jpg',
 *   })} />
 */
SeoHead.project = function project({
  name,
  description,
  slug,
  clientName,
  technologies,
  imageUrl,
}: {
  name: string
  description: string
  slug: string
  clientName?: string
  technologies?: string[]
  imageUrl?: string
}): JsonLdData {
  return {
    '@type': 'CreativeWork',
    name,
    description,
    url: `${SITE_URL}/projects/${slug}`,
    creator: {
      '@type': 'Organization',
      name: 'Carsai Mozambique',
      url: SITE_URL,
    },
    ...(clientName && {
      contributor: {
        '@type': 'Organization',
        name: clientName,
      },
    }),
    ...(technologies && {
      keywords: technologies.join(', '),
    }),
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`,
      },
    }),
  }
}

/**
 * Build a FAQPage JSON-LD.
 *
 * Usage:
 *   <SeoHead jsonLd={SeoHead.faqPage([
 *     { question: 'What services do you offer?', answer: 'We offer web, mobile, cloud, and AI solutions.' },
 *     { question: 'How much does it cost?', answer: 'Prices vary based on the project scope.' },
 *   ])} />
 */
SeoHead.faqPage = function faqPage(
  items: Array<{ question: string; answer: string }>,
): JsonLdData {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export default SeoHead
