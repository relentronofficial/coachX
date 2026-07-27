import type { MetadataRoute } from 'next';
import { brand } from '@/lib/site';

/**
 * robots.txt.
 *
 * The disallow list mirrors what the sitemap omits: authenticated areas and
 * anything that only makes sense with per-user context. `/api/` is blocked
 * because none of it is a page — indexing JSON endpoints wastes crawl budget
 * and can surface submission payloads in search results.
 */
export default function robots(): MetadataRoute.Robots {
  const base = brand.url.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/profile', '/login', '/signup', '/forgot-password', '/reset-password', '/book-strategy-call'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
