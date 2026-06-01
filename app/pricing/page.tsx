import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Zap, Users, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing — Free AI Code Review, Pro at $12/month',
  description:
    'Prova is free with no signup required. Upgrade to Pro for unlimited reviews, GitHub PR URL integration, and team coaching for $12/month.',
  alternates: { canonical: 'https://getprova.dev/pricing' },
}

const FREE_FEATURES = [
  '5 reviews per month',
  'Paste any git diff',
  'Real-time streaming',
  'Multi-model consensus',
  'No credit card required',
]

const PRO_FEATURES = [
  'Unlimited reviews',
  'GitHub PR URL — auto-fetch diff',
  'Post reviews directly to GitHub',
  '1 year review history',
  'Team coaching dashboard',
  'Plain-English custom rules',
  'Per-repo path filters',
  'Priority support',
]

const TEAM_FEATURES = [
  'Everything in Pro',
  'Org-level settings & rules',
  'Shared review history',
  'Team analytics across members',
  'Reviewer assignment suggestions',
  'Slack webhook notifications',
  'Dedicated support channel',
]

const COMPARISON = [
  { feature: 'Real-time token streaming', free: true, pro: true, team: true },
  { feature: 'Multi-model consensus (3 models)', free: true, pro: true, team: true },
  { feature: 'Exact cost per review', free: true, pro: true, team: true },
  { feature: 'Monthly reviews', free: '5', pro: 'Unlimited', team: 'Unlimited' },
  { feature: 'Review via GitHub PR URL', free: false, pro: true, team: true },
  { feature: 'Post review to GitHub', free: false, pro: true, team: true },
  { feature: 'Review history retention', free: '30 days', pro: '1 year', team: '1 year' },
  { feature: 'Team coaching & patterns', free: false, pro: true, team: true },
  { feature: 'Custom rules (plain-English)', free: false, pro: true, team: true },
  { feature: 'Org-level settings', free: false, pro: false, team: true },
  { feature: 'Team analytics', free: false, pro: false, team: true },
]

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value
      ? <span className="text-emerald-400 font-bold">✓</span>
      : <span className="text-[--foreground] opacity-20">—</span>
  }
  return <span className="text-sm text-[--foreground] opacity-70">{value}</span>
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">

      {/* Header */}
      <div className="mb-14 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-[--foreground] sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mt-3 text-base text-[--foreground] opacity-50">
          Start free. Upgrade when you need more. No surprises.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-[--border] bg-[--surface] p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[--foreground] opacity-40">Free</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-black text-[--foreground]">$0</span>
              <span className="mb-1 text-sm text-[--foreground] opacity-40">/month</span>
            </div>
            <p className="mt-2 text-sm text-[--foreground] opacity-50">For individuals exploring AI code review.</p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[--foreground] opacity-60">
                <Check className="size-3.5 shrink-0 text-emerald-400 opacity-100" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/#tool"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-[--border] py-2.5 text-sm font-semibold text-[--foreground] opacity-60 transition-all hover:opacity-100 hover:border-indigo-500/40"
          >
            Start for free
          </Link>
        </div>

        {/* Pro */}
        <div className="flex flex-col rounded-2xl border-2 border-indigo-500/50 bg-[--surface] p-6 shadow-xl shadow-indigo-500/10 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="size-3" />
              Most popular
            </span>
          </div>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-indigo-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Pro</p>
            </div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-black text-[--foreground]">$12</span>
              <span className="mb-1 text-sm text-[--foreground] opacity-40">/month</span>
            </div>
            <p className="mt-2 text-sm text-[--foreground] opacity-50">Unlimited reviews. Full GitHub workflow.</p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[--foreground] opacity-70">
                <Check className="size-3.5 shrink-0 text-indigo-400 opacity-100" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            Get Pro <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Team */}
        <div className="flex flex-col rounded-2xl border border-[--border] bg-[--surface] p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-violet-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Team</p>
            </div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-black text-[--foreground]">$49</span>
              <span className="mb-1 text-sm text-[--foreground] opacity-40">/seat/mo</span>
            </div>
            <p className="mt-2 text-sm text-[--foreground] opacity-50">Org-wide settings and shared coaching.</p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {TEAM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[--foreground] opacity-60">
                <Check className="size-3.5 shrink-0 text-violet-400 opacity-100" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/8 py-2.5 text-sm font-semibold text-violet-300 transition-all hover:bg-violet-500/15"
          >
            Get Team <ArrowRight className="size-4" />
          </Link>
        </div>

      </div>

      {/* Cost context */}
      <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-4">
        <p className="text-sm text-[--foreground] opacity-70">
          <span className="font-semibold text-emerald-400">Real cost example:</span>{' '}
          A team running 50 PRs/month pays ~$1 in LLM costs + $12 Pro plan = <strong className="text-[--foreground]">$13/month total</strong>.
          CodeRabbit charges <span className="line-through opacity-50">$24/user/month</span> with no cost visibility.
        </p>
      </div>

      {/* Comparison table */}
      <div className="mt-16">
        <h2 className="mb-6 text-center text-xl font-bold text-[--foreground]">Full comparison</h2>
        <div className="overflow-hidden rounded-xl border border-[--border]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] bg-[--surface]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[--foreground] opacity-40 w-1/2">Feature</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[--foreground] opacity-40">Free</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-indigo-400">Pro</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-violet-400">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="bg-[--background] hover:bg-[--surface] transition-colors">
                  <td className="px-5 py-3.5 text-[--foreground] opacity-60">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center"><Cell value={row.free} /></td>
                  <td className="px-4 py-3.5 text-center"><Cell value={row.pro} /></td>
                  <td className="px-4 py-3.5 text-center"><Cell value={row.team} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="mb-6 text-center text-xl font-bold text-[--foreground]">Pricing questions</h2>
        <div className="flex flex-col gap-4">
          {[
            { q: 'Can I try Pro before paying?', a: 'Yes — the free tier lets you run 5 reviews per month with all features except PR URL input and saved history. Sign up and review 5 real PRs before deciding.' },
            { q: 'What counts as a review?', a: 'One review = one diff submission (either pasted diff or PR URL). A PR with 10 files counts as one review.' },
            { q: 'How is the LLM cost calculated?', a: 'We pass through your exact Anthropic/OpenAI/Google API cost with zero markup. Typical single-model PR: $0.005–$0.02. 3-model consensus: ~3× that.' },
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from Settings → Billing. Your plan stays active until the end of the billing period. No hidden fees.' },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-[--border] bg-[--surface] px-5 py-4">
              <p className="font-semibold text-sm text-[--foreground]">{q}</p>
              <p className="mt-1.5 text-sm text-[--foreground] opacity-50 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
