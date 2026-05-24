import { createClient } from '@/lib/supabase/server'
import { ReviewStream } from '@/components/ReviewStream'
import { GitPullRequest, Zap, Shield, BarChart3 } from 'lucide-react'

const FEATURES = [
  { icon: GitPullRequest, title: 'Per-file analysis', description: 'Every file reviewed in parallel. Results stream in as they complete.' },
  { icon: Zap, title: 'Under 10 seconds', description: 'Most reviews complete in under 10 seconds. No waiting for a spinner.' },
  { icon: Shield, title: 'Security-focused', description: 'Catches injection attacks, auth bypass, data exposure, and insecure defaults.' },
  { icon: BarChart3, title: 'Structured output', description: 'Issues ranked by severity with line numbers and fix suggestions.' },
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
          Free · No signup required
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          AI code review,{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            in seconds
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          Paste any git diff or enter a GitHub PR URL. Get per-file, streaming code review powered by Claude 3.5 Sonnet — bugs, security, performance, and maintainability.
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
            { cmd: 'Paste GitHub PR URL', label: 'From GitHub (sign in)', mono: false },
          ].map((item) => (
            <div key={item.cmd} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <p className={`text-sm text-zinc-300 ${item.mono !== false ? 'font-mono' : ''}`}>{item.cmd}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.title} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 transition-colors hover:border-zinc-800">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-indigo-950/50 text-indigo-400">
                <Icon className="size-4" />
              </div>
              <h3 className="font-medium text-zinc-200">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{f.description}</p>
            </div>
          )
        })}
      </div>

      {/* Cost callout */}
      <div className="mt-12 mb-4 rounded-xl border border-zinc-800 bg-gradient-to-br from-indigo-950/20 to-violet-950/10 p-6 text-center">
        <p className="text-sm font-medium text-zinc-300">
          Each review costs less than{' '}
          <span className="font-semibold text-indigo-400">$0.02 in API credits</span>
        </p>
        <p className="mt-1 text-xs text-zinc-600">Average 3-file PR · Claude 3.5 Sonnet pricing</p>
      </div>
    </div>
  )
}
