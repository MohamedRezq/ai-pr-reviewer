import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ReviewStream } from '@/components/ReviewStream'
import {
  GitPullRequest,
  Zap,
  Shield,
  BarChart3,
  Layers,
  DollarSign,
  TrendingUp,
  BookOpen,
  GitBranch,
  History,
} from 'lucide-react'

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

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time token streaming',
    description: 'Watch the review stream token-by-token as Claude processes. No waiting for a spinner.',
    badge: 'Unique',
  },
  {
    icon: Layers,
    title: 'Multi-model consensus',
    description: 'Run Claude + GPT-4.1 + Gemini in parallel. See agreement scores per issue — high confidence means all models agree.',
    badge: 'Unique',
  },
  {
    icon: DollarSign,
    title: 'Token cost transparency',
    description: 'Exact LLM cost per review, per repo, per month. No other tool shows you this.',
    badge: 'Unique',
  },
  {
    icon: TrendingUp,
    title: 'Team coaching dashboard',
    description: 'Recurring issue trends per team member. See what your team keeps getting wrong and track improvement.',
    badge: 'Unique',
  },
  {
    icon: GitPullRequest,
    title: 'Per-file analysis',
    description: 'Every file reviewed in parallel. Results stream in as they complete — not a static wall of text.',
  },
  {
    icon: Shield,
    title: 'Security-focused',
    description: 'Injection attacks, auth bypass, data exposure, insecure defaults. Caught before they merge.',
  },
  {
    icon: BookOpen,
    title: 'Plain-English custom rules',
    description: 'Write rules in natural sentences, not YAML. "Never use console.log in production" — done.',
  },
  {
    icon: GitBranch,
    title: 'Path-filtered auto-review',
    description: 'Auto-review PRs touching /src, skip docs/tests. Connect GitHub webhook → it just works.',
  },
  {
    icon: BarChart3,
    title: 'Structured output',
    description: 'Issues ranked by severity with line numbers and concrete fix suggestions. Copy to Markdown in one click.',
  },
  {
    icon: History,
    title: 'Historical pattern detection',
    description: 'Vector similarity search across past reviews: "this pattern caused a bug in PR #234 two months ago."',
  },
]

const FAQ = [
  {
    q: 'How is this different from GitHub Copilot code review?',
    a: 'Copilot reviews are static suggestions. Prova streams results in real-time as each file is processed, runs multi-model consensus across Claude + GPT-4.1 + Gemini, shows you exact token costs, and learns from your team\'s historical issues. No IDE plugin required — works on any git diff.',
  },
  {
    q: 'Does it work without signing in?',
    a: 'Yes. Paste any git diff and get a full review instantly, no account required. Sign in with GitHub to unlock PR URL input, review history, cost tracking, and team coaching features.',
  },
  {
    q: 'How do I get a diff to paste?',
    a: 'Run `git diff main` to compare your branch against main, `git diff HEAD~1` for your last commit, or paste a GitHub PR URL directly. Prova also supports auto-review via GitHub webhooks.',
  },
  {
    q: 'What does multi-model consensus mean?',
    a: 'When you enable multi-model mode, Prova runs your diff through Claude 3.5, GPT-4.1, and Gemini 2.0 Flash simultaneously. Issues flagged by 2+ models get "high confidence" badges — if all three models agree, it\'s almost certainly a real issue.',
  },
  {
    q: 'How much does it cost per review?',
    a: 'A typical 3-file PR costs under $0.02 with Claude only. Multi-model consensus is still under $0.06. You can see exact costs per review and per month in your dashboard — a feature no other AI review tool offers.',
  },
  {
    q: 'Can I add team-specific coding rules?',
    a: 'Yes. In Settings → Custom Rules, write plain-English rules like "All SQL queries must use parameterized statements" or "Never use class components". These rules are injected as context into every future review.',
  },
  {
    q: 'Does it support path filters and auto-review?',
    a: 'Yes. In Settings → Repos, configure which file paths to include or exclude per repo (e.g. only review src/**, skip **/*.test.ts). Enable auto-review to trigger a review whenever a PR is opened or updated via GitHub webhooks.',
  },
  {
    q: 'Is my code stored?',
    a: 'Diffs are never stored. Only review results (issues, summaries, verdicts) are saved to your account if you\'re signed in. You can delete any review at any time.',
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
    // Supabase not configured — anonymous mode
  }

  return (
    <div className="mx-auto max-w-4xl px-4">
      {/* Hero */}
      <div className="pt-14 pb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-900/50 bg-indigo-950/30 px-4 py-1.5 text-xs font-medium text-indigo-400">
          <span className="size-1.5 rounded-full bg-indigo-400" />
          Free · No signup required · Claude + GPT-4.1 + Gemini
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          AI code review,{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            in seconds
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          Paste any git diff or GitHub PR URL. Streaming, per-file code review from Claude 3.5,
          GPT-4.1, and Gemini — bugs, security, performance, maintainability.
        </p>
      </div>

      {/* Main tool */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl shadow-black/50">
        <ReviewStream isLoggedIn={isLoggedIn} githubToken={githubToken} />
      </div>

      {/* How to get a diff */}
      <div className="mt-8 rounded-xl border border-zinc-900 bg-zinc-950/60 p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          How to get your diff
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { cmd: 'git diff main', label: 'Branch vs main' },
            { cmd: 'git diff HEAD~1', label: 'Last commit' },
            { cmd: 'Paste GitHub PR URL', label: 'From GitHub (sign in for private repos)', mono: false },
          ].map((item) => (
            <div key={item.cmd} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <p className={`text-sm text-zinc-300 ${item.mono !== false ? 'font-mono' : ''}`}>{item.cmd}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-16">
        <h2 className="mb-6 text-center text-lg font-semibold text-zinc-200">
          What makes Prova different
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 transition-colors hover:border-zinc-800"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-950/50 text-indigo-400">
                    <Icon className="size-4" />
                  </div>
                  {f.badge && (
                    <span className="rounded-full bg-violet-950 px-2 py-0.5 text-xs font-medium text-violet-400">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-zinc-200">{f.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{f.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cost callout */}
      <div className="mt-12 rounded-xl border border-zinc-800 bg-gradient-to-br from-indigo-950/20 to-violet-950/10 p-6 text-center">
        <p className="text-sm font-medium text-zinc-300">
          Each review costs less than{' '}
          <span className="font-semibold text-indigo-400">$0.02 in API credits</span>
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Average 3-file PR · Claude 3.5 Sonnet pricing · Multi-model consensus under $0.06
        </p>
      </div>

      {/* FAQ Section (long-tail SEO) */}
      <div className="mt-20 mb-8">
        <h2 className="mb-8 text-center text-xl font-semibold text-zinc-200">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5">
              <h3 className="font-medium text-zinc-200 mb-2">{q}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
