import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, listReviews, checkUsageLimit } from '@/lib/supabase/db'
import { UsageMeter } from '@/components/UsageMeter'
import { ReviewHistoryCard } from '@/components/ReviewHistoryCard'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard')

  const [profile, recentReviews, usage] = await Promise.all([
    getProfile(supabase, user.id),
    listReviews(supabase, user.id, { limit: 5 }),
    checkUsageLimit(supabase, user.id),
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

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Reviews', value: String(recentReviews.length > 0 ? '…' : '0') },
                { label: 'Plan', value: profile?.plan ?? 'free', capitalize: true },
              ].map(({ label, value, capitalize }) => (
                <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs text-zinc-600">{label}</p>
                  <p className={`mt-0.5 text-lg font-semibold text-zinc-100 ${capitalize ? 'capitalize' : ''}`}>
                    {value}
                  </p>
                </div>
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
