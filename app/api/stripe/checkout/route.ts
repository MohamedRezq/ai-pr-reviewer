import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/db'
import { createCheckoutSession } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { plan?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const plan = body.plan
  if (plan !== 'pro' && plan !== 'team') {
    return Response.json({ error: 'Invalid plan. Must be "pro" or "team".' }, { status: 400 })
  }

  const profile = await getProfile(supabase, user.id)
  if (profile?.plan === plan) {
    return Response.json({ error: 'Already on this plan' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  try {
    const url = await createCheckoutSession(
      user.id,
      profile?.email ?? user.email ?? null,
      plan,
      `${origin}/settings/billing?upgraded=true`,
      `${origin}/settings/billing`,
    )
    return Response.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return Response.json({ error: message }, { status: 500 })
  }
}
