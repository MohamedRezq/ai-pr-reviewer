import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewStream } from '@/components/ReviewStream'
import { FaqAccordion } from '@/components/FaqAccordion'
import { ArrowRight, Zap, Layers, DollarSign, TrendingUp, ShieldCheck, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Code Review for Pull Requests — Free & Instant | Prova',
  description:
    'Paste any git diff or GitHub PR URL. Streaming AI code review from Claude, GPT-4.1, and Gemini. Catch bugs, security issues, and performance problems in seconds. Free — no signup required.',
  alternates: { canonical: 'https://getprova.dev' },
}

const FEATURES = [
  {
    icon: Zap,
    title: 'Streams token-by-token',
    desc: 'See the review as Claude writes it — multiple files in parallel. No waiting.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Layers,
    title: '3-model consensus',
    desc: 'Claude + GPT-4.1 + Gemini review the same diff. Issues all three agree on = high confidence.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    badge: 'Unique',
  },
  {
    icon: DollarSign,
    title: 'Exact cost per review',
    desc: 'See the precise USD cost per review. Typical PR: under $0.02. No flat subscription.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badge: 'Unique',
  },
  {
    icon: TrendingUp,
    title: 'Team coaching',
    desc: '30-day pattern analysis. See which issues your team keeps repeating — and track improvement.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    badge: 'Unique',
  },
  {
    icon: ShieldCheck,
    title: 'Security-first',
    desc: 'SQL injection, missing auth checks, hardcoded secrets — flagged by severity, not noise.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icon: BookOpen,
    title: 'Plain-English rules',
    desc: '"Never use console.log in production." No YAML, no regex — just type your team\'s standards.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
]

const FAQ = [
  {
    q: 'Does it work without signing in?',
    a: 'Yes. Paste any git diff and get a full review instantly — no account required. Sign in with GitHub to unlock PR URL input, saved history, and team coaching.',
  },
  {
    q: 'What makes it different from GitHub Copilot or CodeRabbit?',
    a: 'Prova streams results token-by-token, runs 3-model consensus (Claude + GPT-4.1 + Gemini simultaneously), shows exact LLM cost per review, and builds coaching insights from your team\'s patterns. CodeRabbit charges $24/month flat and does none of this.',
  },
  {
    q: 'How much does each review cost?',
    a: 'A typical 3-file PR costs under $0.02 with Claude. Multi-model consensus: under $0.06. You pay your exact API cost — no markup, no subscription.',
  },
  {
    q: 'How do I get a diff to paste?',
    a: 'Run git diff main for branch vs main, or git diff HEAD~1 for your last commit. Or paste a GitHub PR URL directly if you\'re signed in.',
  },
  {
    q: 'Is my code ever stored?',
    a: 'Diffs are never stored. Only review results (issues, summaries, verdicts) are saved for signed-in users. Delete any review at any time.',
  },
]

export default async function Home() {
  let isLoggedIn = false
  let githubToken: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      isLoggedIn = true
      const { data: { session } } = await supabase.auth.getSession()
      githubToken = session?.provider_token ?? null
    }
  } catch { /* anonymous mode */ }

  return (
    <div className="mx-auto max-w-4xl px-5">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pt-16 pb-10 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/8 px-3.5 py-1.5">
          <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse-subtle" />
          <span className="text-xs font-medium text-indigo-400">Free — no signup required</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-[--foreground]">AI code review,</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            in seconds.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[--foreground] opacity-50">
          Paste a git diff or GitHub PR URL. Bugs, security issues, and performance
          problems streamed instantly — from Claude, GPT-4.1, and Gemini.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-[0.98]"
          >
            Connect GitHub
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#tool"
            className="inline-flex items-center gap-2 rounded-xl border border-[--border] bg-[--surface] px-6 py-3 text-sm font-semibold text-[--foreground] opacity-70 transition-all hover:opacity-100 hover:border-indigo-500/40"
          >
            Try free — no login
          </a>
        </div>
      </div>

      {/* ── Live tool ────────────────────────────────────────────────────── */}
      <section id="tool" className="scroll-mt-20">
        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-2xl shadow-black/20">
          {/* Window chrome */}
          <div className="flex items-center gap-3 border-b border-[--border] bg-[--background]/60 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-500/60" />
              <div className="size-3 rounded-full bg-yellow-500/60" />
              <div className="size-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 rounded-md border border-[--border] bg-[--surface] px-3 py-1 text-center text-xs text-[--foreground] opacity-30">
              getprova.dev
            </div>
          </div>
          <div className="p-5">
            <ReviewStream isLoggedIn={isLoggedIn} githubToken={githubToken} />
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[--foreground] opacity-30">
        {['Diffs never stored', 'No setup required', 'Up to 50 files per review', 'Cancel anytime'].map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-current" />
            {t}
          </span>
        ))}
      </div>

      {/* ── Features grid ────────────────────────────────────────────────── */}
      <section className="mt-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-[--foreground]">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-2 text-sm text-[--foreground] opacity-50">
            Built differently from every other code review tool.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group rounded-xl border border-[--border] bg-[--surface] p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-black/10"
              >
                <div className={`mb-3 inline-flex size-9 items-center justify-center rounded-lg ${f.bg}`}>
                  <Icon className={`size-4.5 ${f.color}`} />
                </div>
                <div className="flex items-start gap-2">
                  <h3 className="text-sm font-semibold text-[--foreground]">{f.title}</h3>
                  {f.badge && (
                    <span className="shrink-0 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[--foreground] opacity-50">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Differentiator band ──────────────────────────────────────────── */}
      <section className="mt-20 overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[--border]">
          {[
            { label: 'vs CodeRabbit', value: '$24/mo flat', desc: 'Prova: pay only for what you use (~$0.02/PR)' },
            { label: 'vs GitHub Copilot', value: 'IDE-only', desc: 'Prova: browser, no plugin, no IDE lock-in' },
            { label: 'vs manual review', value: '2–4 hours', desc: 'Prova: first result in under 3 seconds' },
          ].map((item) => (
            <div key={item.label} className="px-6 py-5">
              <p className="text-xs font-medium text-[--foreground] opacity-40 uppercase tracking-wider">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-red-400 line-through opacity-60">{item.value}</p>
              <p className="mt-1 text-sm text-[--foreground] opacity-70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mt-20">
        <h2 className="mb-6 text-center text-2xl font-bold text-[--foreground]">
          Common questions
        </h2>
        <FaqAccordion items={FAQ} />
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="my-20 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-14 text-center shadow-2xl shadow-indigo-500/20">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Start your first review now
        </h2>
        <p className="mt-2 text-indigo-200">
          No credit card. No setup. Paste a diff and go.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-700 shadow-md transition-all hover:bg-indigo-50 active:scale-[0.98]"
          >
            Connect GitHub <ArrowRight className="size-4" />
          </Link>
          <a
            href="#tool"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            Try without account
          </a>
        </div>
      </section>

    </div>
  )
}
