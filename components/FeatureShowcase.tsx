'use client'

import { useState } from 'react'
import { Zap, Layers, DollarSign, TrendingUp, BookOpen, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  {
    id: 'streaming',
    icon: Zap,
    label: 'Live Streaming',
    color: 'indigo',
    headline: 'See it happen, not wait for it',
    bullets: [
      'Token-by-token output as Claude writes the review',
      'Multiple files reviewed in parallel simultaneously',
      'Progress bar always shows where you are',
    ],
    badge: null,
  },
  {
    id: 'consensus',
    icon: Layers,
    label: '3-Model Consensus',
    color: 'violet',
    headline: 'Three opinions. One verdict.',
    bullets: [
      'Claude 3.5 + GPT-4.1 + Gemini run on the same diff',
      'High-confidence = all three models agree',
      'Disagreements shown transparently — you decide',
    ],
    badge: 'Unique',
  },
  {
    id: 'cost',
    icon: DollarSign,
    label: 'Cost Clarity',
    color: 'emerald',
    headline: 'Pay for exactly what you use',
    bullets: [
      'Exact USD cost per review, per file, per model',
      'Monthly dashboard: total spend at a glance',
      'No flat subscriptions — typical PR under $0.02',
    ],
    badge: 'Unique',
  },
  {
    id: 'coaching',
    icon: TrendingUp,
    label: 'Team Coaching',
    color: 'orange',
    headline: 'Reviews that build better habits',
    bullets: [
      '30-day rolling analysis of your recurring issues',
      'Improvement score tracks progress over time',
      'Links to the exact PRs where patterns appeared',
    ],
    badge: 'Unique',
  },
  {
    id: 'rules',
    icon: BookOpen,
    label: 'Custom Rules',
    color: 'sky',
    headline: 'Your standards, auto-enforced',
    bullets: [
      '"Never use console.log in production" — just type it',
      'No YAML, no regex, no system-prompt engineering',
      'Scoped per repo or applied to everything',
    ],
    badge: null,
  },
]

const COLOR_STYLES = {
  indigo: {
    tab: 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/40',
    tabInactive: 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    check: 'text-indigo-500',
    accent: 'bg-indigo-500',
    border: 'border-indigo-200 dark:border-indigo-900/50',
    glow: 'from-indigo-50 dark:from-indigo-950/20',
  },
  violet: {
    tab: 'bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-900/40',
    tabInactive: 'hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    check: 'text-violet-500',
    accent: 'bg-violet-500',
    border: 'border-violet-200 dark:border-violet-900/50',
    glow: 'from-violet-50 dark:from-violet-950/20',
  },
  emerald: {
    tab: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/40',
    tabInactive: 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    check: 'text-emerald-500',
    accent: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    glow: 'from-emerald-50 dark:from-emerald-950/20',
  },
  orange: {
    tab: 'bg-orange-500 text-white shadow-orange-200 dark:shadow-orange-900/40',
    tabInactive: 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    check: 'text-orange-500',
    accent: 'bg-orange-500',
    border: 'border-orange-200 dark:border-orange-900/50',
    glow: 'from-orange-50 dark:from-orange-950/20',
  },
  sky: {
    tab: 'bg-sky-500 text-white shadow-sky-200 dark:shadow-sky-900/40',
    tabInactive: 'hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    check: 'text-sky-500',
    accent: 'bg-sky-500',
    border: 'border-sky-200 dark:border-sky-900/50',
    glow: 'from-sky-50 dark:from-sky-950/20',
  },
}

// ─── Mock UIs (light-mode + dark-mode aware) ─────────────────────────────────

function StreamingMock() {
  return (
    <div className="flex flex-col gap-2 text-xs font-mono">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-sans text-gray-500 dark:text-zinc-500">Reviewing 3 files…</span>
        <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-sans font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">2 / 3</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
        <div className="h-full w-2/3 rounded-full bg-indigo-500" />
      </div>

      <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
              <Check className="size-3 text-white" />
            </div>
            <span className="text-gray-700 dark:text-zinc-300">src/api/auth.ts</span>
          </div>
          <span className="font-sans text-gray-400 dark:text-zinc-500">$0.008</span>
        </div>
        <p className="mt-1 font-sans text-emerald-700 dark:text-emerald-400">2 issues · approved</p>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <div className="mb-2 flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-indigo-500" />
          <span className="text-gray-700 dark:text-zinc-300">src/utils/validate.ts</span>
        </div>
        <p className="font-sans text-gray-600 leading-relaxed dark:text-zinc-400">
          &quot;JWT expiry set to 7 days with no refresh logic, meaning expired tokens are not revoked...&quot;
          <span className="animate-pulse text-indigo-500">▌</span>
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 opacity-50 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-full border-2 border-gray-300 dark:border-zinc-600" />
          <span className="font-sans text-gray-400 dark:text-zinc-500">src/models/user.ts · waiting…</span>
        </div>
      </div>
    </div>
  )
}

function ConsensusMock() {
  const models = [
    { label: 'Claude', bg: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
    { label: 'GPT-4.1', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    { label: 'Gemini', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-gray-600 dark:text-zinc-400">src/auth/login.ts</span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">94% agreement</span>
      </div>
      <div className="flex gap-2">
        {models.map((m) => (
          <span key={m.label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.bg}`}>{m.label}</span>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">High Confidence</p>
        {[
          { title: 'SQL injection on line 47', agreed: [true, true, true], sev: 'critical' },
          { title: 'Missing rate limit on /login', agreed: [true, true, true], sev: 'critical' },
        ].map((issue) => (
          <div key={issue.title} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950 dark:text-red-400">{issue.sev}</span>
            <span className="flex-1 text-gray-700 dark:text-zinc-300">{issue.title}</span>
            <div className="flex gap-1">
              {issue.agreed.map((v, i) => <span key={i} className={v ? 'font-bold text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}>{v ? '✓' : '✗'}</span>)}
            </div>
          </div>
        ))}
        <p className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">Medium — 2 of 3 agree</p>
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-400">warning</span>
          <span className="flex-1 text-gray-600 dark:text-zinc-400">Token expiry not validated</span>
          <div className="flex gap-1">
            <span className="font-bold text-emerald-500">✓</span>
            <span className="font-bold text-emerald-500">✓</span>
            <span className="text-gray-300 dark:text-zinc-700">✗</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CostMock() {
  const reviews = [
    { name: 'pr/auth-refactor', cost: '$0.031', tag: '3 models' },
    { name: 'pr/dashboard-ui', cost: '$0.019', tag: 'Claude' },
    { name: 'pr/fix-null-check', cost: '$0.008', tag: 'Claude' },
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
        <p className="text-emerald-100 text-[11px] uppercase tracking-wider">This month</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-black">$0.23</span>
          <span className="mb-1 text-emerald-100">across 12 PRs</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-[4%] rounded-full bg-white" />
          </div>
          <span className="text-emerald-100 whitespace-nowrap text-[10px]">vs $24/mo CodeRabbit</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {reviews.map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div>
              <p className="font-mono text-gray-700 dark:text-zinc-300">{r.name}</p>
              <p className="text-gray-400 dark:text-zinc-600">{r.tag}</p>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.cost}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoachingMock() {
  const issues = [
    { label: 'Missing error handling', count: 23, pct: 90 },
    { label: 'Input not validated', count: 12, pct: 48 },
    { label: 'SQL injection risk', count: 8, pct: 32 },
    { label: 'console.log in prod', count: 4, pct: 16 },
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 dark:text-zinc-300">30-day patterns</span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">↓ 34% this month</span>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col gap-3">
          {issues.map((issue, i) => (
            <div key={issue.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-600 dark:bg-orange-950 dark:text-orange-400">{i + 1}</span>
                  <span className="text-gray-700 dark:text-zinc-300">{issue.label}</span>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-bold text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">×{issue.count}</span>
              </div>
              <div className="ml-7 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-orange-400 dark:bg-orange-500 transition-all" style={{ width: `${issue.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="size-2 rounded-full bg-emerald-500" />
        <span className="text-emerald-700 dark:text-emerald-400">Improving — 4 fewer issues per PR vs last month</span>
      </div>
    </div>
  )
}

function RulesMock() {
  const rules = [
    { text: 'Wrap async operations in try/catch', on: true },
    { text: 'Never console.log in production', on: true },
    { text: 'SQL queries must use parameterized statements', on: true },
    { text: 'Validate all API endpoint inputs', on: false },
  ]

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-col gap-1.5">
        {rules.map((rule) => (
          <div
            key={rule.text}
            className={cn(
              'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-all',
              rule.on
                ? 'border-sky-200 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/20'
                : 'border-gray-200 bg-gray-50 opacity-50 dark:border-zinc-800 dark:bg-zinc-900/40',
            )}
          >
            {rule.on
              ? <Check className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
              : <X className="mt-0.5 size-3.5 shrink-0 text-gray-400 dark:text-zinc-600" />}
            <span className={rule.on ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-400 dark:text-zinc-600'}>{rule.text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center rounded-lg border border-dashed border-sky-300 bg-sky-50/50 px-3 py-2.5 text-sky-500 dark:border-sky-900/50 dark:bg-sky-950/10">
        + Add plain-English rule…
      </div>
      <p className="text-center text-gray-400 dark:text-zinc-600">No YAML · No regex · Just sentences</p>
    </div>
  )
}

const MOCK_MAP: Record<string, React.ReactNode> = {
  streaming: <StreamingMock />,
  consensus: <ConsensusMock />,
  cost: <CostMock />,
  coaching: <CoachingMock />,
  rules: <RulesMock />,
}

export function FeatureShowcase() {
  const [active, setActive] = useState('streaming')
  const tab = TABS.find((t) => t.id === active) ?? TABS[0]
  const colors = COLOR_STYLES[tab.color as keyof typeof COLOR_STYLES]

  return (
    <section className="mt-20">
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = t.id === active
          const c = COLOR_STYLES[t.color as keyof typeof COLOR_STYLES]
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
                isActive
                  ? `${c.tab} shadow-md`
                  : `border border-gray-200 bg-white text-gray-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 ${c.tabInactive}`,
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t.label}
              {t.badge && isActive && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div className={cn('mt-3 grid overflow-hidden rounded-2xl border bg-gradient-to-br to-white sm:grid-cols-2 dark:to-zinc-950', colors.border, colors.glow)}>
        {/* Left — text */}
        <div className="flex flex-col justify-center p-8 sm:border-r border-gray-100 dark:border-zinc-800">
          {tab.badge && (
            <span className={cn('mb-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold', colors.badge)}>
              {tab.badge}
            </span>
          )}
          <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-zinc-100">{tab.headline}</h3>
          <ul className="flex flex-col gap-3">
            {tab.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <Check className={cn('mt-0.5 size-4 shrink-0 font-bold', colors.check)} />
                <span className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — visual mock */}
        <div className="flex items-center justify-center bg-gray-50/80 p-6 sm:p-8 dark:bg-zinc-900/40">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
            {/* Window chrome */}
            <div className="mb-4 flex items-center gap-1.5">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-yellow-400" />
              <div className="size-3 rounded-full bg-green-400" />
              <div className="ml-auto rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-400 dark:bg-zinc-800 dark:text-zinc-600">getprova.dev</div>
            </div>
            {MOCK_MAP[active]}
          </div>
        </div>
      </div>
    </section>
  )
}
