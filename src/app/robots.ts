/**
 * Carsai Mozambique — Dynamic robots.txt
 *
 * Next.js MetadataRoute.Robots format.
 * Allows all crawlers, disallows private areas (admin, user, partner),
 * and points to the sitemap.
 */

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/client-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/user/', '/partner/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
