import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewStream } from '@/components/ReviewStream'
import { FeatureShowcase } from '@/components/FeatureShowcase'
import { FaqAccordion } from '@/components/FaqAccordion'
import { ArrowRight, Terminal, GitBranch, Link2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Code Review for Pull Requests — Free & Instant',
  description:
    'Paste any git diff or GitHub PR URL. Get streaming, per-file code review from Claude 3.5, GPT-4.1, and Gemini. Bugs, security, performance. Free. No signup required.',
  openGraph: {
    title: 'Prova — AI Code Review, in seconds',
    description:
      'Real-time streaming code review from Claude + GPT-4.1 + Gemini. Multi-model consensus, cost transparency, team coaching. Free.',
  },
}

const FAQ = [
  {
    q: 'Does it work without signing in?',
    a: 'Yes. Paste any git diff and get a full review instantly — no account required. Sign in with GitHub to unlock PR URL input, review history, cost tracking, and team coaching.',
  },
  {
    q: 'How is this different from GitHub Copilot or CodeRabbit?',
    a: 'Copilot reviews are static suggestions. CodeRabbit charges a flat $24/month regardless of usage. Prova streams results token-by-token, runs multi-model consensus, shows exact LLM costs per review, and builds a team coaching profile from your patterns — features no other tool has.',
  },
  {
    q: 'What does multi-model consensus mean?',
    a: 'When you enable multi-model mode, Prova runs your diff through Claude 3.5, GPT-4.1, and Gemini 2.0 Flash simultaneously. Issues flagged by 2+ models get "high confidence" badges. If all three agree, it\'s almost certainly a real bug.',
  },
  {
    q: 'How much does it cost per review?',
    a: 'A typical 3-file PR costs under $0.02 with Claude only. Multi-model consensus is still under $0.06. You pay only your actual API costs — no markup, no flat subscription fee.',
  },
  {
    q: 'How do I get a diff to paste?',
    a: 'Run `git diff main` to compare your branch against main, `git diff HEAD~1` for your last commit, or paste a GitHub PR URL directly. Prova also supports auto-review on PR open via GitHub webhooks.',
  },
  {
    q: 'Can I add team-specific rules?',
    a: 'Yes. In Settings → Custom Rules, write rules in plain sentences like "All SQL queries must use parameterized statements". No YAML, no templates — just type it, and every future review checks against it.',
  },
  {
    q: 'Is my code ever stored?',
    a: 'Diffs are never stored on our servers. Only review results (issues, summaries, verdicts) are saved to your account. You can delete any review at any time.',
  },
  {
    q: 'Does it support private GitHub repos?',
    a: 'Yes. Sign in with GitHub and paste the PR URL — Prova uses your OAuth token to fetch the diff directly. Your token is never stored; it lives only in your session.',
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
  } catch {
    // anonymous mode
  }

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-60 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4">

        {/* ── Hero ── */}
        <div className="pt-16 pb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-800/40 bg-indigo-950/40 px-4 py-1.5 text-xs font-medium text-indigo-400 backdrop-blur-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-indigo-400" />
            Free · No signup · Streams in real time
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl">
            Code review that{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              thinks for itself
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            Paste a diff or GitHub PR URL. Three AI models review in parallel, stream results
            file-by-file, and give you one confident verdict — in under 10 seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Connect GitHub
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#try-it"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-zinc-500 hover:text-white"
            >
              Try it free — no login needed
            </a>
          </div>

          {/* Model trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-600">
            <span>Powered by</span>
            {[
              { label: 'Claude 3.5', color: 'text-orange-400' },
              { label: 'GPT-4.1', color: 'text-emerald-400' },
              { label: 'Gemini 2.0', color: 'text-blue-400' },
            ].map(({ label, color }) => (
              <span key={label} className={`font-semibold ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="mb-12 grid grid-cols-3 divide-x divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          {[
            { value: '<10s', label: 'Average review time' },
            { value: '$0.02', label: 'Typical cost per PR' },
            { value: '3 models', label: 'Running in parallel' },
          ].map((stat) => (
            <div key={stat.label} className="py-5 text-center">
              <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Live tool ── */}
        <div id="try-it" className="scroll-mt-20">
          {/* How to get a diff */}
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {[
              { icon: Terminal, cmd: 'git diff main', label: 'Branch vs main' },
              { icon: GitBranch, cmd: 'git diff HEAD~1', label: 'Last commit' },
              { icon: Link2, cmd: 'Paste GitHub PR URL', label: 'Private repos — sign in first', mono: false },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.cmd} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <Icon className="size-4 shrink-0 text-zinc-600" />
                  <div>
                    <p className={`text-sm text-zinc-300 ${item.mono !== false ? 'font-mono' : ''}`}>{item.cmd}</p>
                    <p className="text-xs text-zinc-600">{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* The actual tool */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl shadow-black/60">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-zinc-700" />
                <div className="size-3 rounded-full bg-zinc-700" />
                <div className="size-3 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 rounded-md bg-zinc-800 px-3 py-1 text-xs text-zinc-500 text-center">
                getprova.dev
              </div>
            </div>
            <div className="p-5">
              <ReviewStream isLoggedIn={isLoggedIn} githubToken={githubToken} />
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <section className="mt-24">
          <div className="mb-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              How it works
            </span>
          </div>
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-zinc-100">
            From diff to verdict in 3 steps
          </h2>

          <div className="grid gap-px rounded-2xl bg-zinc-800 overflow-hidden sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Paste your diff',
                desc: 'Drop in a git diff output or a GitHub PR URL. Private repos work too — just connect GitHub.',
                color: 'from-indigo-500/10',
              },
              {
                step: '02',
                title: 'Models review in parallel',
                desc: 'Up to 3 AI models analyze each file simultaneously. Results stream to your screen as they arrive.',
                color: 'from-violet-500/10',
              },
              {
                step: '03',
                title: 'Get a confident verdict',
                desc: 'Issues ranked by severity with line numbers and fix suggestions. Copy to Markdown or post to GitHub.',
                color: 'from-indigo-500/10',
              },
            ].map((step) => (
              <div key={step.step} className={`bg-zinc-950 bg-gradient-to-b ${step.color} to-transparent p-7`}>
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-indigo-950 text-sm font-bold text-indigo-400">
                  {step.step}
                </div>
                <h3 className="mb-2 font-semibold text-zinc-200">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature showcase tabs ── */}
        <FeatureShowcase />

        {/* ── Comparison strip ── */}
        <section className="mt-24">
          <div className="mb-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              Comparison
            </span>
          </div>
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-100">
            Why not just use something else?
          </h2>

          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/60 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="px-5 py-3">Feature</div>
              <div className="px-4 py-3 text-indigo-400">Prova</div>
              <div className="px-4 py-3">CodeRabbit</div>
              <div className="px-4 py-3">Copilot Review</div>
            </div>
            {[
              ['Real-time streaming', '✓', '✗', '✗'],
              ['Multi-model consensus', '✓', '✗', '✗'],
              ['Token cost visibility', '✓', '✗', '✗'],
              ['Team coaching', '✓', '✗', '✗'],
              ['Plain-English rules', '✓', '✗', '✗'],
              ['Pay-as-you-go pricing', '✓', '✗', '✗'],
              ['Works without IDE plugin', '✓', '✓', '✗'],
              ['Free tier', '✓', '✓', 'Partial'],
            ].map(([feature, ...vals]) => (
              <div key={feature} className="grid grid-cols-4 border-t border-zinc-800/60 text-sm hover:bg-zinc-900/30 transition-colors">
                <div className="px-5 py-3.5 text-zinc-400">{feature}</div>
                {vals.map((v, i) => (
                  <div key={i} className={`px-4 py-3.5 font-medium ${v === '✓' && i === 0 ? 'text-emerald-400' : v === '✗' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {v}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mt-24 mb-8">
          <div className="mb-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              FAQ
            </span>
          </div>
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-100">
            Questions & answers
          </h2>
          <FaqAccordion items={FAQ} />
        </section>

        {/* ── Bottom CTA ── */}
        <section className="my-20 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-indigo-950/40 via-zinc-950 to-violet-950/30 px-8 py-14 text-center relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
          <h2 className="mb-3 text-3xl font-bold text-zinc-100">
            Start reviewing in 30 seconds
          </h2>
          <p className="mb-8 text-zinc-400">
            No credit card. No setup. Paste your first diff and see the difference.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
            >
              Connect GitHub
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#try-it"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-7 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-zinc-500"
            >
              Try without signing in
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}
