import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as any })
  }
  return _stripe
}

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 1200, // cents
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    features: [
      'Unlimited reviews',
      'GitHub PR URL integration',
      'Post reviews to GitHub',
      '1 year review history',
      'Custom ignore rules',
      'Priority support',
    ],
  },
  team: {
    name: 'Team',
    price: 4900, // per seat
    priceId: process.env.STRIPE_TEAM_PRICE_ID ?? '',
    features: [
      'Everything in Pro',
      'Team analytics dashboard',
      'Org-level settings',
      'Shared review history',
      'Slack notifications',
      'Dedicated support',
    ],
  },
} as const

export async function createCheckoutSession(
  userId: string,
  userEmail: string | null,
  plan: 'pro' | 'team',
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: userEmail ?? undefined,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Failed to create checkout session')
  return session.url
}

export async function getOrCreateCustomer(
  stripe: Stripe,
  userId: string,
  email: string | null,
): Promise<string> {
  const existing = await stripe.customers.search({
    query: `metadata["userId"]:"${userId}"`,
    limit: 1,
  })

  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { userId },
  })

  return customer.id
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}
