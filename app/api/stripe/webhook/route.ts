import { getStripe } from '@/lib/stripe'
import { upgradePlan } from '@/lib/supabase/db'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

async function getSupabaseServiceClient() {
  const { createServiceClient } = await import('@/lib/supabase/server')
  return createServiceClient()
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'Stripe webhook secret not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return Response.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  const supabase = await getSupabaseServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan as 'pro' | 'team' | undefined

      if (userId && plan && (plan === 'pro' || plan === 'team')) {
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? undefined
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? undefined

        await upgradePlan(supabase, userId, plan, { customerId, subscriptionId })
        console.log(`Upgraded user ${userId} to ${plan}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (userId) {
        await upgradePlan(supabase, userId, 'free')
        console.log(`Downgraded user ${userId} to free`)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('Payment failed for invoice:', invoice.id)
      // In production: send email notification via Resend/Postmark
      break
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`)
  }

  return Response.json({ received: true })
}
