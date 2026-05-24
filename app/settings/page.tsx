import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/db'
import { User, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react'
import { GitHubIcon } from '@/components/GitHubIcon'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/settings')

  const profile = await getProfile(supabase, user.id)
  const { data: { session } } = await supabase.auth.getSession()
  const hasGitHubToken = !!session?.provider_token

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-zinc-100">Settings</h1>

      <div className="flex flex-col gap-6">
        {/* Profile */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
            <User className="size-4 text-zinc-500" />
            <h2 className="font-medium text-zinc-200">Profile</h2>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Avatar" className="size-14 rounded-full" />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                  {(profile?.username ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-zinc-100">{profile?.name ?? profile?.username}</p>
                <p className="text-sm text-zinc-500">@{profile?.username}</p>
                <p className="text-sm text-zinc-600">{profile?.email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-600">
              Profile synced from GitHub. Update at{' '}
              <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:underline">
                github.com/settings/profile
              </a>
            </p>
          </div>
        </section>

        {/* GitHub Connection */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
            <GitHubIcon className="size-4 text-zinc-500" />
            <h2 className="font-medium text-zinc-200">GitHub Connection</h2>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {hasGitHubToken ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <p className="text-sm font-medium text-zinc-200">Connected as @{profile?.username}</p>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-zinc-400">Not connected</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  {hasGitHubToken
                    ? 'You can review PRs by URL and post reviews to GitHub.'
                    : 'Sign in again to connect GitHub and review PRs by URL.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Billing */}
        <Link
          href="/settings/billing"
          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 transition-colors hover:border-zinc-700"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="size-4 text-zinc-500" />
            <div>
              <p className="font-medium text-zinc-200">Billing & Plan</p>
              <p className="text-sm text-zinc-500 capitalize">
                {profile?.plan ?? 'free'} plan
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-zinc-600" />
        </Link>
      </div>
    </div>
  )
}
