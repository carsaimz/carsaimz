/**
 * Carsai Mozambique — Dynamic Sitemap
 *
 * Generates a sitemap.xml using Next.js MetadataRoute.Sitemap format.
 * Includes all public static pages plus dynamic slugs from Firestore
 * for services, projects, and blog posts.
 *
 * Uses safe Firestore helpers so a missing collection never crashes the build.
 */

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/client-config'
import { safeQueryDocs, safeGetDocs } from '@/lib/db-helpers'

// Revalidation interval (in seconds) — Next.js will re-run this function
// at most once per hour to pick up new content without a full rebuild.
export const revalidate = 3600

/**
 * Build a sitemap entry for a static page.
 */
function staticEntry(
  path: string,
  priority: number,
  changefreq: MetadataRoute.Sitemap[number]['changeFrequency'],
  lastModified?: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency: changefreq,
    priority,
  }
}

/**
 * Safely convert a Firestore value to a valid Date object.
 * Handles: Firestore Timestamp objects ({seconds, nanoseconds}),
 * ISO date strings, Date objects, and null/undefined.
 * Returns undefined if the value cannot be converted.
 */
function safeToDate(value: any): Date | undefined {
  if (!value) return undefined

  // Firestore Timestamp object (has seconds + nanoseconds)
  if (typeof value === 'object' && value.seconds !== undefined) {
    try {
      const ms = value.seconds * 1000 + (value.nanoseconds || 0) / 1e6
      const d = new Date(ms)
      return isNaN(d.getTime()) ? undefined : d
    } catch {
      return undefined
    }
  }

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value
  }

  // String (ISO date or other parseable format)
  if (typeof value === 'string') {
    try {
      const d = new Date(value)
      return isNaN(d.getTime()) ? undefined : d
    } catch {
      return undefined
    }
  }

  return undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static public pages ───
  const staticPages: MetadataRoute.Sitemap = [
    staticEntry('/', 1.0, 'weekly'),
    staticEntry('/services', 0.9, 'weekly'),
    staticEntry('/projects', 0.9, 'weekly'),
    staticEntry('/blog', 0.9, 'daily'),
    staticEntry('/forum', 0.8, 'daily'),
    staticEntry('/about', 0.7, 'monthly'),
    staticEntry('/faq', 0.7, 'monthly'),
    staticEntry('/contact', 0.7, 'monthly'),
    staticEntry('/testimonials', 0.7, 'monthly'),
    staticEntry('/quote', 0.8, 'monthly'),
    staticEntry('/privacy', 0.3, 'yearly'),
    staticEntry('/terms', 0.3, 'yearly'),
    staticEntry('/cookies', 0.3, 'yearly'),
    staticEntry('/dmca', 0.3, 'yearly'),
  ]

  // ─── Dynamic service pages ───
  let serviceEntries: MetadataRoute.Sitemap = []
  try {
    // Try indexed query first (isPublished == true)
    const publishedServices = await safeQueryDocs<{ slug: string; updatedAt?: string }>(
      'services',
      [{ field: 'isPublished', op: '==', value: true }],
      'order',
      'asc',
    )

    // Fallback: if indexed query returns empty, try all docs and filter
    const services = publishedServices.length > 0
      ? publishedServices
      : (await safeGetDocs<{ slug: string; isPublished?: boolean; updatedAt?: string }>('services'))
          .filter((s: any) => s.isPublished !== false)

    serviceEntries = services
      .filter((s: any) => s.slug)
      .map((s: any) => ({
        url: `${SITE_URL}/services/${s.slug}`,
        lastModified: safeToDate(s.updatedAt) ?? new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))
  } catch {
    // Firestore unavailable — skip dynamic entries
  }

  // ─── Dynamic project pages ───
  let projectEntries: MetadataRoute.Sitemap = []
  try {
    const publishedProjects = await safeQueryDocs<{ slug: string; updatedAt?: string }>(
      'projects',
      [{ field: 'isPublished', op: '==', value: true }],
      'createdAt',
      'desc',
    )

    const projects = publishedProjects.length > 0
      ? publishedProjects
      : (await safeGetDocs<{ slug: string; isPublished?: boolean; updatedAt?: string }>('projects'))
          .filter((p: any) => p.isPublished !== false)

    projectEntries = projects
      .filter((p: any) => p.slug)
      .map((p: any) => ({
        url: `${SITE_URL}/projects/${p.slug}`,
        lastModified: safeToDate(p.updatedAt) ?? new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))
  } catch {
    // Firestore unavailable — skip dynamic entries
  }

  // ─── Dynamic blog post pages ───
  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const publishedPosts = await safeQueryDocs<{ slug: string; updatedAt?: string }>(
      'posts',
      [{ field: 'published', op: '==', value: true }],
      'createdAt',
      'desc',
    )

    // Fallback: if indexed query returns empty, try all docs and filter
    const posts = publishedPosts.length > 0
      ? publishedPosts
      : (await safeGetDocs<{ slug: string; published?: boolean; updatedAt?: string }>('posts'))
          .filter((p: any) => p.published === true)

    blogEntries = posts
      .filter((p: any) => p.slug)
      .map((p: any) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: safeToDate(p.updatedAt) ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
  } catch {
    // Firestore unavailable — skip dynamic entries
  }

  // ─── Dynamic forum topic pages ───
  let forumEntries: MetadataRoute.Sitemap = []
  try {
    const forumTopics = await safeGetDocs<{ slug: string; updatedAt?: string }>('forum_topics')
    forumEntries = forumTopics
      .filter((t: any) => t.slug)
      .map((t: any) => ({
        url: `${SITE_URL}/forum/${t.slug}`,
        lastModified: safeToDate(t.updatedAt) ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch {
    // Firestore unavailable — skip dynamic entries
  }

  // ─── Combine all entries ───
  return [...staticPages, ...serviceEntries, ...projectEntries, ...blogEntries, ...forumEntries]
}
