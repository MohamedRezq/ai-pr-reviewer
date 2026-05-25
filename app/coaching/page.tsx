import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeCoachingInsights } from '@/lib/coaching'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Minus, ArrowRight, BookOpen, Target } from 'lucide-react'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-950',
  warning: 'text-amber-400 bg-amber-950',
  suggestion: 'text-blue-400 bg-blue-950',
  info: 'text-zinc-400 bg-zinc-800',
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  security: 'Security',
  performance: 'Performance',
  maintainability: 'Maintainability',
  style: 'Style',
}

export default async function CoachingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/coaching')

  const insights = await computeCoachingInsights(supabase, user.id)

  const periodStartDate = new Date(insights.periodStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const periodEndDate = new Date(insights.periodEnd).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const improvementSign = insights.improvementScore !== null
    ? insights.improvementScore > 5 ? 'improving'
    : insights.improvementScore < -5 ? 'declining'
    : 'stable'
    : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
          <span>/</span>
          <span className="text-zinc-300">Team Coaching</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Team Coaching Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Recurring issue patterns over the last 30 days ({periodStartDate}–{periodEndDate})
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Reviews (30d)" value={String(insights.totalReviews)} />
        <StatCard label="Issues Found" value={String(insights.totalIssues)} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs text-zinc-600">Trend</p>
          {improvementSign === null || insights.improvementScore === null ? (
            <p className="mt-1 text-lg font-semibold text-zinc-400">—</p>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <p className={`text-lg font-semibold ${
                improvementSign === 'improving' ? 'text-emerald-400'
                : improvementSign === 'declining' ? 'text-red-400'
                : 'text-zinc-400'
              }`}>
                {insights.improvementScore > 0 ? '+' : ''}{insights.improvementScore}%
              </p>
              {improvementSign === 'improving' ? (
                <TrendingDown className="size-4 text-emerald-400" aria-label="Fewer issues — improving!" />
              ) : improvementSign === 'declining' ? (
                <TrendingUp className="size-4 text-red-400" aria-label="More issues — declining" />
              ) : (
                <Minus className="size-4 text-zinc-500" />
              )}
            </div>
          )}
          <p className="mt-0.5 text-xs text-zinc-600">issues per review (lower = better)</p>
        </div>
      </div>

      {insights.totalReviews === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
          <BookOpen className="mx-auto size-8 text-zinc-600 mb-3" />
          <p className="text-zinc-500">No reviews in the last 30 days.</p>
          <p className="mt-1 text-sm text-zinc-600">Run a few reviews to see your coaching insights.</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Run a review
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top recurring issues */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-medium text-zinc-200">
              <Target className="size-4 text-indigo-400" />
              Recurring Issues
            </h2>
            {insights.topIssues.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-8 text-center">
                <p className="text-sm text-zinc-500">No patterns detected yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {insights.topIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
                  >
                    <span className="mt-0.5 text-sm font-bold text-zinc-600 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 leading-snug">{issue.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${SEVERITY_COLORS[issue.severity] ?? 'bg-zinc-800 text-zinc-400'}`}>
                          {issue.severity}
                        </span>
                        <span className="text-xs text-zinc-600">{CATEGORY_LABELS[issue.category] ?? issue.category}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                      ×{issue.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvement tips */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-medium text-zinc-200">
              <BookOpen className="size-4 text-violet-400" />
              Focus Areas
            </h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              {insights.topIssues.length === 0 ? (
                <p className="text-sm text-zinc-500">Run more reviews to see personalized focus areas.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(
                    insights.topIssues.reduce(
                      (acc, issue) => {
                        acc[issue.category] = (acc[issue.category] ?? 0) + issue.count
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">{CATEGORY_LABELS[category] ?? category}</span>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{
                                width: `${Math.min(100, (count / insights.totalIssues) * 100 * 3)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  <div className="mt-2 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {improvementSign === 'improving'
                        ? '✓ Issue count is trending down — great progress!'
                        : improvementSign === 'declining'
                          ? '⚠ Issue count is trending up this period.'
                          : 'Issue rate is stable. Focus on the categories above.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-medium text-zinc-400 mb-2">Quick actions</p>
              <div className="flex flex-col gap-2">
                <Link href="/settings/rules" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                  <ArrowRight className="size-3.5 text-indigo-400" />
                  Add custom rules for top issues
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                  <ArrowRight className="size-3.5 text-indigo-400" />
                  Run a new review
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  )
}
