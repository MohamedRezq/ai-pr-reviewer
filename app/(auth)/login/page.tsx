import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginButton } from './LoginButton'
import { GitBranch, Zap, Shield, History } from 'lucide-react'

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const params = await searchParams
  const redirectTo = params.redirectTo ?? '/dashboard'
  const error = params.error

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
              AI
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Sign in to PR Reviewer</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Connect your GitHub account to unlock PR URL reviews, history, and more.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <LoginButton redirectTo={redirectTo} />

        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            { icon: GitBranch, text: 'Review any PR by URL' },
            { icon: History, text: 'Save review history' },
            { icon: Zap, text: 'Faster with context' },
            { icon: Shield, text: 'Post reviews to GitHub' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5"
            >
              <Icon className="size-3.5 shrink-0 text-indigo-400" />
              <span className="text-xs text-zinc-400">{text}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Your code is never stored. GitHub token used only to fetch PR diffs.
        </p>
      </div>
    </div>
  )
}
