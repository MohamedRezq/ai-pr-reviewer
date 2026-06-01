import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewStream } from '@/components/ReviewStream'
import { ArrowRight, Zap, Layers, DollarSign } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Code Review for Pull Requests — Free & Instant | Prova',
  description:
    'Paste any git diff or GitHub PR URL. Streaming AI code review from Claude, GPT-4.1, and Gemini. Catch bugs, security issues, and performance problems in seconds. Free — no signup required.',
  alternates: { canonical: 'https://getprova.dev' },
}

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
    <div className="mx-auto max-w-3xl px-5">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="pt-20 pb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/6 px-3 py-1.5 text-xs font-medium text-indigo-400">
          <span className="size-1.5 rounded-full bg-indigo-400" />
          Free · No signup required
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          AI code review,{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            in seconds.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed opacity-50">
          Paste a git diff or GitHub PR URL. Bugs, security issues, and performance
          problems — streamed live from Claude, GPT-4.1, and Gemini.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            Connect GitHub
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#tool"
            className="inline-flex items-center gap-2 rounded-xl border border-[--border] px-6 py-3 text-sm font-medium opacity-60 transition-all hover:opacity-100"
          >
            Try free — no login
          </a>
        </div>
      </div>

      {/* ── Tool ─────────────────────────────────────────────────────── */}
      <section id="tool" className="scroll-mt-16">
        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-[--border] px-5 py-3">
            <span className="text-xs font-medium opacity-40">Prova — AI Code Review</span>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-indigo-500/60" />
              <span className="text-[10px] opacity-30">Live</span>
            </div>
          </div>
          <div className="p-5">
            <ReviewStream isLoggedIn={isLoggedIn} githubToken={githubToken} />
          </div>
        </div>
      </section>

      {/* ── Why it's different ────────────────────────────────────────── */}
      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            title: 'Streams live',
            desc: 'See results as Claude writes them — token by token, file by file.',
            color: 'text-indigo-400',
          },
          {
            icon: Layers,
            title: '3-model consensus',
            desc: 'Claude + GPT-4.1 + Gemini review the same diff. High-confidence results.',
            color: 'text-violet-400',
          },
          {
            icon: DollarSign,
            title: 'Exact cost shown',
            desc: 'See the precise USD cost per review. Typical PR: under $0.02.',
            color: 'text-emerald-400',
          },
        ].map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="rounded-xl border border-[--border] bg-[--surface] p-5"
            >
              <Icon className={`mb-3 size-5 ${f.color}`} />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed opacity-45">{f.desc}</p>
            </div>
          )
        })}
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="my-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-12 text-center shadow-xl shadow-indigo-500/20">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Start reviewing in 30 seconds
        </h2>
        <p className="mt-2 text-sm text-indigo-200">
          No credit card. No setup. Just paste a diff.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-md transition-all hover:bg-indigo-50 active:scale-[0.98]"
          >
            Connect GitHub <ArrowRight className="size-4" />
          </Link>
          <a
            href="#tool"
            className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            Try without account
          </a>
        </div>
      </section>

    </div>
  )
}
