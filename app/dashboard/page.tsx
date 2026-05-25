import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, listReviews, checkUsageLimit, getMonthlyCost } from '@/lib/supabase/db'
import { UsageMeter } from '@/components/UsageMeter'
import { ReviewHistoryCard } from '@/components/ReviewHistoryCard'
import Link from 'next/link'
import { Plus, ArrowRight, DollarSign, TrendingUp, Settings, BookOpen } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard')

  const [profile, recentReviews, usage, monthlyCost] = await Promise.all([
    getProfile(supabase, user.id),
    listReviews(supabase, user.id, { limit: 5 }),
    checkUsageLimit(supabase, user.id),
    getMonthlyCost(supabase, user.id).catch(() => ({ totalUsd: 0, reviewCount: 0 })),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Hey, {profile?.name?.split(' ')[0] ?? profile?.username ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Here&apos;s your review activity.</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="size-4" />
          New Review
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Usage meter */}
        <div className="lg:col-span-1">
          <UsageMeter
            used={usage.used}
            plan={profile?.plan ?? 'free'}
            resetAt={usage.resetAt}
          />

          {/* Monthly cost widget */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <DollarSign className="size-3.5 text-emerald-400" />
                This Month
              </h2>
              <span className="text-xs text-zinc-600">LLM costs</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-600">Total Cost</p>
                <p className="mt-0.5 text-lg font-semibold text-emerald-400">
                  {monthlyCost.totalUsd < 0.001
                    ? monthlyCost.totalUsd === 0 ? '$0.00' : `$${(monthlyCost.totalUsd * 1000).toFixed(2)}m`
                    : `$${monthlyCost.totalUsd.toFixed(3)}`}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-600">Plan</p>
                <p className="mt-0.5 text-lg font-semibold capitalize text-zinc-100">
                  {profile?.plan ?? 'free'}
                </p>
              </div>
            </div>
          </div>

          {/* Coaching + settings links */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">Tools</h2>
            <div className="flex flex-col gap-2">
              {[
                { href: '/coaching', icon: TrendingUp, label: 'Team Coaching', desc: 'Issue trends & patterns' },
                { href: '/settings/rules', icon: BookOpen, label: 'Custom Rules', desc: 'Plain-English review rules' },
                { href: '/settings/repos', icon: Settings, label: 'Repo Settings', desc: 'Path filters & auto-review' },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 hover:border-zinc-700 transition-colors">
                  <Icon className="size-4 shrink-0 text-indigo-400" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200">{label}</p>
                    <p className="text-xs text-zinc-600">{desc}</p>
                  </div>
                  <ArrowRight className="ml-auto size-3.5 shrink-0 text-zinc-700" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent reviews */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-zinc-200">Recent Reviews</h2>
            {recentReviews.length > 0 && (
              <Link href="/reviews" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
                View all <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>

          {recentReviews.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
              <p className="text-zinc-500">No reviews yet.</p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                <Plus className="size-4" />
                Run your first review
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentReviews.map((review) => (
                <ReviewHistoryCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
