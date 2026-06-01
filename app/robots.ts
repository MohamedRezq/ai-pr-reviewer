import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/lib/app-url'

const APP_URL = getAppUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/settings/',
          '/api/',
          '/coaching',
          '/reviews',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
