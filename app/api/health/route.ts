import { isAdminClientConfigured } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'optional'> = {}

  checks.anthropic_key = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error'
  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error'
  checks.supabase_publishable_key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'ok' : 'error'
  checks.supabase_secret_key = isAdminClientConfigured() ? 'ok' : 'error'
  checks.openai_key = process.env.OPENAI_API_KEY ? 'ok' : 'optional'
  checks.google_ai_key = process.env.GOOGLE_AI_API_KEY ? 'ok' : 'optional'
  checks.stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET ? 'ok' : 'optional'

  const requiredOk = ['anthropic_key', 'supabase_url', 'supabase_publishable_key', 'supabase_secret_key']
    .every((k) => checks[k] === 'ok')

  return Response.json(
    {
      status: requiredOk ? 'ok' : 'degraded',
      environment: process.env.VERCEL_ENV ?? 'local',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      checks,
    },
    { status: requiredOk ? 200 : 503 },
  )
}
