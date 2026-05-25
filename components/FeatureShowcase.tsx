'use client'

import { useState } from 'react'
import { Zap, Layers, DollarSign, TrendingUp, BookOpen, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  {
    id: 'streaming',
    icon: Zap,
    label: 'Live Streaming',
    headline: 'Watch every token as it arrives',
    sub: 'No spinners. No waiting. Results stream file-by-file the moment Claude starts processing — you see the review being written in real time.',
    bullets: [
      'Token-by-token typewriter effect per file',
      'Files reviewed in parallel — fastest finish first',
      'Progress bar shows exactly where you are',
    ],
    badge: null,
  },
  {
    id: 'consensus',
    icon: Layers,
    label: 'Multi-Model',
    headline: '3 AI minds, one verdict',
    sub: 'Claude, GPT-4.1, and Gemini review the same diff simultaneously. Issues all three agree on are flagged as high-confidence. Disagreements are shown transparently.',
    bullets: [
      'Per-issue agreement score (high / medium / low)',
      'One model\'s blind spot covered by two others',
      'Select any combination of models per review',
    ],
    badge: 'Industry first',
  },
  {
    id: 'cost',
    icon: DollarSign,
    label: 'Cost Clarity',
    headline: 'Know exactly what you spend',
    sub: 'Every review shows the exact LLM cost in USD. Monthly totals per repo. No other AI review tool exposes this — most hide it behind flat subscriptions.',
    bullets: [
      'Per-review cost breakdown by model',
      'Monthly dashboard: "$0.23 across 12 PRs"',
      'Typically under $0.02 per PR (Claude only)',
    ],
    badge: 'Unique',
  },
  {
    id: 'coaching',
    icon: TrendingUp,
    label: 'Team Coaching',
    headline: 'Reviews that teach, not just flag',
    sub: 'After every review cycle, patterns surface. See which issues your team keeps repeating, track improvement month-over-month, and add rules to prevent recurrence.',
    bullets: [
      '30-day rolling pattern analysis per team',
      'Improvement score: fewer issues = trending up',
      'Links directly to the reviews that caused patterns',
    ],
    badge: 'Unique',
  },
  {
    id: 'rules',
    icon: BookOpen,
    label: 'Custom Rules',
    headline: 'Your standards, auto-enforced',
    sub: 'Write rules in plain English. No YAML, no regex, no system prompt engineering. Just type your standard and every future review checks against it automatically.',
    bullets: [
      '"Always wrap async ops in try/catch" — done',
      'Scoped per repo or applied globally',
      'Toggle rules on/off without deleting them',
    ],
    badge: null,
  },
]

// ─── Mock UIs ────────────────────────────────────────────────────────────────

function StreamingMock() {
  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-zinc-500">Reviewing 3 files</span>
        <span className="rounded-full bg-indigo-950 px-2 py-0.5 text-indigo-400">2 / 3</span>
      </div>
      <div className="h-1 w-full rounded-full bg-zinc-800">
        <div className="h-full w-2/3 rounded-full bg-indigo-500 transition-all" />
      </div>

      {/* File 1 — complete */}
      <div className="mt-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-400" />
            <span className="text-zinc-300">src/api/auth.ts</span>
          </div>
          <span className="text-zinc-600">$0.008</span>
        </div>
        <p className="mt-1 text-zinc-500">2 issues found · approved</p>
      </div>

      {/* File 2 — streaming */}
      <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Loader2 className="size-3.5 animate-spin text-indigo-400" />
          <span className="text-zinc-300">src/utils/validate.ts</span>
        </div>
        <p className="text-zinc-500 leading-relaxed">
          &quot;Checking the JWT expiry validation — the token lifetime is set to 7 days but there is no refresh logic, which means...&quot;
          <span className="animate-pulse text-indigo-400">▌</span>
        </p>
      </div>

      {/* File 3 — waiting */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 opacity-50">
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full border border-zinc-700" />
          <span className="text-zinc-500">src/models/user.ts</span>
          <span className="ml-auto text-zinc-700">waiting…</span>
        </div>
      </div>
    </div>
  )
}

function ConsensusMock() {
  const models = [
    { label: 'Claude', color: 'text-orange-400 bg-orange-950' },
    { label: 'GPT-4.1', color: 'text-emerald-400 bg-emerald-950' },
    { label: 'Gemini', color: 'text-blue-400 bg-blue-950' },
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-zinc-400">src/auth/login.ts</span>
        <span className="rounded-full bg-emerald-950 px-2 py-0.5 font-semibold text-emerald-400">94% agreement</span>
      </div>

      <div className="flex gap-2">
        {models.map((m) => (
          <span key={m.label} className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.color}`}>
            {m.label}
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2.5">
        <p className="text-zinc-600 uppercase tracking-wider text-[10px] font-semibold">High Confidence</p>

        {[
          { title: 'SQL injection on line 47', agreed: [true, true, true] },
          { title: 'Missing rate limit on /login', agreed: [true, true, true] },
        ].map((issue) => (
          <div key={issue.title} className="flex items-center gap-2">
            <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] text-red-400">critical</span>
            <span className="flex-1 text-zinc-300">{issue.title}</span>
            <div className="flex gap-1">
              {issue.agreed.map((v, i) => (
                <span key={i} className={v ? 'text-emerald-400' : 'text-zinc-700'}>
                  {v ? '✓' : '✗'}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div className="border-t border-zinc-800 pt-2">
          <p className="text-zinc-600 uppercase tracking-wider text-[10px] font-semibold mb-2">Medium — 2 of 3 agree</p>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] text-amber-400">warning</span>
            <span className="flex-1 text-zinc-400">Token expiry not validated</span>
            <div className="flex gap-1">
              <span className="text-emerald-400">✓</span>
              <span className="text-emerald-400">✓</span>
              <span className="text-zinc-700">✗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CostMock() {
  const reviews = [
    { name: 'pr/auth-refactor', cost: '$0.031', models: 'Claude · GPT · Gemini' },
    { name: 'pr/dashboard-ui', cost: '$0.019', models: 'Claude only' },
    { name: 'pr/fix-null-check', cost: '$0.008', models: 'Claude only' },
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider">This month</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-2xl font-bold text-zinc-100">$0.23</span>
          <span className="mb-0.5 text-zinc-500">across 12 PRs</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-[4%] rounded-full bg-emerald-500" />
          </div>
          <span className="text-zinc-600 whitespace-nowrap">vs $24/mo CodeRabbit</span>
        </div>
        <p className="mt-1 text-emerald-400 text-[10px]">99% savings vs fixed subscriptions</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {reviews.map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <div>
              <p className="font-mono text-zinc-300">{r.name}</p>
              <p className="text-zinc-600">{r.models}</p>
            </div>
            <span className="font-semibold text-zinc-200">{r.cost}</span>
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
        <span className="text-zinc-400 font-medium">30-day patterns</span>
        <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-emerald-400">↓ 34% this month</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {issues.map((issue, i) => (
          <div key={issue.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-4 text-zinc-600 text-center font-bold">{i + 1}</span>
                <span className="text-zinc-300">{issue.label}</span>
              </div>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-400">×{issue.count}</span>
            </div>
            <div className="ml-6 h-1.5 w-full rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${issue.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-zinc-400">Improving — 4 fewer issues per PR vs last month</span>
      </div>
    </div>
  )
}

function RulesMock() {
  const rules = [
    { text: 'Always wrap async operations in try/catch', enabled: true },
    { text: 'Never use console.log in production code', enabled: true },
    { text: 'SQL queries must use parameterized statements', enabled: true },
    { text: 'All API endpoints must validate input schema', enabled: false },
  ]

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-col gap-1.5">
        {rules.map((rule) => (
          <div
            key={rule.text}
            className={cn(
              'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-opacity',
              rule.enabled ? 'border-zinc-700 bg-zinc-900/60' : 'border-zinc-800 bg-zinc-950/60 opacity-50',
            )}
          >
            {rule.enabled ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            ) : (
              <X className="mt-0.5 size-3.5 shrink-0 text-zinc-600" />
            )}
            <span className={rule.enabled ? 'text-zinc-300' : 'text-zinc-600'}>{rule.text}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-zinc-700 px-3 py-2.5 text-zinc-600 text-center">
        + Add plain-English rule…
      </div>

      <p className="text-center text-zinc-700">No YAML · No regex · Just sentences</p>
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

  return (
    <section className="mt-24">
      <div className="mb-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          What makes it different
        </span>
      </div>
      <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-zinc-100">
        More than a linter wrapper
      </h2>
      <p className="mx-auto mb-10 max-w-lg text-center text-sm text-zinc-500">
        Features that don&apos;t exist anywhere else — built for teams that ship fast and want to keep improving.
      </p>

      {/* Tab buttons — horizontally scrollable on mobile */}
      <div className="mb-0 flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t.label}
              {t.badge && (
                <span className="hidden rounded-full bg-violet-950 px-1.5 py-0.5 text-[10px] font-medium text-violet-400 sm:inline">
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="grid min-h-[340px] overflow-hidden rounded-b-xl border border-t-0 border-zinc-800 bg-zinc-950 sm:grid-cols-2">
        {/* Left — description */}
        <div className="flex flex-col justify-center p-8 sm:border-r sm:border-zinc-800">
          {tab.badge && (
            <span className="mb-3 inline-flex w-fit rounded-full bg-violet-950 px-3 py-1 text-xs font-semibold text-violet-300">
              {tab.badge}
            </span>
          )}
          <h3 className="mb-3 text-xl font-bold text-zinc-100">{tab.headline}</h3>
          <p className="mb-5 text-sm leading-relaxed text-zinc-400">{tab.sub}</p>
          <ul className="flex flex-col gap-2">
            {tab.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <Check className="mt-0.5 size-4 shrink-0 text-indigo-400" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — mock UI */}
        <div className="flex items-center justify-center bg-zinc-900/40 p-6 sm:p-8">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
            {/* Mock window chrome */}
            <div className="mb-4 flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-zinc-700" />
              <div className="size-2.5 rounded-full bg-zinc-700" />
              <div className="size-2.5 rounded-full bg-zinc-700" />
              <div className="ml-auto rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-600">
                prova.dev
              </div>
            </div>
            {MOCK_MAP[active]}
          </div>
        </div>
      </div>
    </section>
  )
}
