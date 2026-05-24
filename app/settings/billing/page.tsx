'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PLANS, formatPrice } from '@/lib/stripe'
import { CheckCircle2, Zap, Users, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/lib/supabase/types'

function UpgradedBanner() {
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded') === 'true'

  if (!upgraded) return null

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
      <CheckCircle2 className="size-5 text-emerald-400" />
      <p className="text-sm font-medium text-emerald-300">
        Upgrade successful! Your plan has been updated.
      </p>
    </div>
  )
}

function BillingContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login?redirectTo=/settings/billing'; return }
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      setProfile(data as UserProfile)
      setLoading(false)
    }
    load()
  }, [])

  const handleUpgrade = async (plan: 'pro' | 'team') => {
    setUpgrading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Failed to start checkout')
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  const currentPlan = profile?.plan ?? 'free'

  return (
    <>
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-sm text-zinc-500">Current plan</p>
        <p className="mt-1 text-xl font-bold capitalize text-zinc-100">{currentPlan}</p>
        {currentPlan === 'free' && (
          <p className="mt-1 text-sm text-zinc-500">5 reviews per month · No credit card required</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.entries(PLANS) as [string, typeof PLANS.pro][]).map(([key, plan]) => {
          const planKey = key as 'pro' | 'team'
          const isCurrent = currentPlan === planKey
          const Icon = planKey === 'team' ? Users : Zap

          return (
            <div
              key={planKey}
              className={cn(
                'rounded-xl border p-5 transition-all',
                isCurrent ? 'border-indigo-700 bg-indigo-950/30' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700',
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-indigo-400" />
                  <span className="font-semibold text-zinc-100">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-zinc-100">{formatPrice(plan.price)}</span>
                  <span className="text-sm text-zinc-500">/mo</span>
                </div>
              </div>
              <ul className="mb-5 flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="rounded-lg border border-indigo-800/50 bg-indigo-950/50 py-2.5 text-center text-sm font-medium text-indigo-400">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={upgrading === planKey}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
                >
                  {upgrading === planKey ? <><Loader2 className="size-4 animate-spin" />Redirecting…</> : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Secure payment via Stripe · Cancel anytime · No hidden fees
      </p>
    </>
  )
}

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">Billing & Plan</h1>
      <p className="mb-8 text-sm text-zinc-500">Manage your subscription and usage.</p>
      <Suspense fallback={null}>
        <UpgradedBanner />
      </Suspense>
      <BillingContent />
    </div>
  )
}
