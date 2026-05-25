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
    'Paste any git diff or GitHub PR URL. Streaming per-file code review from Claude 3.5, GPT-4.1, and Gemini. Bugs, security, performance. Free, no signup required.',
  openGraph: {
    title: 'Prova — AI Code Review, in seconds',
    description: 'Real-time streaming code review · Multi-model consensus · Team coaching · Free.',
  },
}

const FAQ = [
  { q: 'Does it work without signing in?', a: 'Yes. Paste any git diff and get a full review instantly — no account required. Sign in with GitHub to unlock PR URL input, review history, cost tracking, and team coaching.' },
  { q: 'How is this different from GitHub Copilot or CodeRabbit?', a: 'Copilot reviews are static post-merge suggestions. CodeRabbit charges $24/month flat. Prova streams results token-by-token, runs multi-model consensus, shows exact LLM costs per review, and builds coaching insights from your team\'s patterns — none of which exist elsewhere.' },
  { q: 'What does multi-model consensus mean?', a: 'Claude 3.5, GPT-4.1, and Gemini 2.0 Flash all review the same diff simultaneously. Issues flagged by 2+ models get "high confidence" badges. If all three agree, it\'s almost certainly real.' },
  { q: 'How much does each review cost?', a: 'Typical 3-file PR: under $0.02 with Claude only. Multi-model consensus: under $0.06. You pay your actual API costs — no markup, no subscription.' },
  { q: 'How do I get a diff to paste?', a: 'Run `git diff main` for branch vs main, `git diff HEAD~1` for your last commit, or paste a GitHub PR URL directly. Auto-review via GitHub webhook is also supported.' },
  { q: 'Can I add team-specific rules?', a: 'Yes. Settings → Custom Rules. Write in plain sentences: "All SQL queries must use parameterized statements." No YAML, no regex — just type it.' },
  { q: 'Is my code ever stored?', a: 'Diffs are never stored. Only review results (issues, summaries, verdicts) are saved. Delete any review at any time.' },
  { q: 'Does it support private GitHub repos?', a: 'Yes. Sign in with GitHub and paste the PR URL — Prova uses your OAuth token to fetch the diff. The token is never stored; it lives only in your session.' },
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
    <div className="mx-auto max-w-5xl px-4">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pt-12 pb-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50 sm:text-6xl">
          Better code review,{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            in seconds.
          </span>
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-500 hover:shadow-indigo-300 dark:shadow-indigo-900/40"
          >
            Connect GitHub
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#tool"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:text-gray-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500"
          >
            Try free — no login needed
          </a>
        </div>
      </div>

      {/* ── Feature showcase (tabs) — ABOVE the tool ─────────────────────── */}
      <FeatureShowcase />

      {/* ── Live tool ────────────────────────────────────────────────────── */}
      <section id="tool" className="mt-16 scroll-mt-20">
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-zinc-100">
          Try it right now
        </h2>

        {/* Diff shortcuts */}
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {[
            { icon: Terminal, cmd: 'git diff main', label: 'Branch vs main' },
            { icon: GitBranch, cmd: 'git diff HEAD~1', label: 'Last commit' },
            { icon: Link2, cmd: 'Paste a GitHub PR URL', label: 'Private repos — sign in first', mono: false },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.cmd} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <Icon className="size-4 shrink-0 text-gray-400 dark:text-zinc-600" />
                <div>
                  <p className={`text-sm text-gray-800 dark:text-zinc-200 ${item.mono !== false ? 'font-mono' : ''}`}>{item.cmd}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-600">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* The review tool */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-yellow-400" />
              <div className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400 text-center border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
              getprova.dev
            </div>
          </div>
          <div className="p-5">
            <ReviewStream isLoggedIn={isLoggedIn} githubToken={githubToken} />
          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────── */}
      <section className="mt-20">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-zinc-100">
          How it stacks up
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800/60">
            {['Feature', 'Prova', 'CodeRabbit', 'Copilot'].map((h, i) => (
              <div key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${i === 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-zinc-500'}`}>{h}</div>
            ))}
          </div>
          {[
            ['Real-time streaming', '✓', '✗', '✗'],
            ['Multi-model consensus', '✓', '✗', '✗'],
            ['Cost per-review visibility', '✓', '✗', '✗'],
            ['Team coaching & patterns', '✓', '✗', '✗'],
            ['Plain-English rules', '✓', '✗', '✗'],
            ['Pay as you go', '✓', '✗', '✗'],
            ['No IDE plugin required', '✓', '✓', '✗'],
            ['Free tier', '✓', '✓', 'Partial'],
          ].map(([feature, ...vals]) => (
            <div key={feature} className="grid grid-cols-4 border-t border-gray-100 text-sm transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
              <div className="px-5 py-3.5 text-gray-600 dark:text-zinc-400">{feature}</div>
              {vals.map((v, i) => (
                <div key={i} className={`px-5 py-3.5 font-semibold ${i === 0 && v === '✓' ? 'text-indigo-600 dark:text-indigo-400' : v === '✗' ? 'text-gray-300 dark:text-zinc-700' : 'text-gray-500 dark:text-zinc-500'}`}>
                  {v}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mt-20">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-zinc-100">Questions</h2>
        <FaqAccordion items={FAQ} />
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="my-20 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-14 text-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30">
        <h2 className="mb-2 text-3xl font-extrabold text-white">Start in 30 seconds</h2>
        <p className="mb-7 text-indigo-100">No credit card. No setup. Paste your first diff now.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-700 shadow-md transition-all hover:bg-indigo-50"
          >
            Connect GitHub <ArrowRight className="size-4" />
          </Link>
          <a href="#tool" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
            Try without account
          </a>
        </div>
      </section>

    </div>
  )
}
