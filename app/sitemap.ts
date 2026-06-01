import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/lib/app-url'

const APP_URL = getAppUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${APP_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${APP_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${APP_URL}/coaching`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/settings/rules`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/settings/repos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/settings/billing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Include public reviews in sitemap
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { data: publicReviews } = await supabase
      .from('reviews')
      .select('id, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(200)

    const reviewRoutes: MetadataRoute.Sitemap = (publicReviews ?? []).map((r) => ({
      url: `${APP_URL}/review/${r.id}`,
      lastModified: new Date(r.created_at),
      changeFrequency: 'never' as const,
      priority: 0.5,
    }))

    return [...staticRoutes, ...reviewRoutes]
  } catch {
    return staticRoutes
  }
}
