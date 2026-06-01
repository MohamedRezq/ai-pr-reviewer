/**
 * Canonical app URL for SEO, webhooks, and OG tags.
 * Production: set NEXT_PUBLIC_APP_URL to your custom domain.
 * Preview/staging: falls back to VERCEL_URL when unset.
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured) return configured
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, '')
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}
