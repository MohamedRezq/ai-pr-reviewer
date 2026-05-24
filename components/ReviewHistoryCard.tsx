import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ReviewRow } from '@/lib/supabase/types'
import { CheckCircle2, XCircle, MessageSquare, GitBranch, Calendar, FileCode2 } from 'lucide-react'

interface ReviewHistoryCardProps {
  review: ReviewRow
}

const VERDICT_CONFIG = {
  approved: { icon: CheckCircle2, label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/40' },
  needs_changes: { icon: XCircle, label: 'Needs Changes', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/30' },
  nitpick: { icon: MessageSquare, label: 'Nitpick', color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/30' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ReviewHistoryCard({ review }: ReviewHistoryCardProps) {
  const verdict = review.verdict ? VERDICT_CONFIG[review.verdict] : null
  const VerdictIcon = verdict?.icon

  const title = review.pr_title ?? (review.pr_url ? `PR #${review.pr_number}` : 'Diff Review')
  const subtitle = review.repo ?? 'Direct diff'

  return (
    <Link href={`/review/${review.id}`} className="block">
      <div
        className={cn(
          'rounded-xl border p-4 transition-all hover:brightness-110',
          verdict?.bg ?? 'border-zinc-800 bg-zinc-900/60',
        )}
      >
        <div className="flex items-start gap-3">
          {VerdictIcon && (
            <VerdictIcon className={cn('mt-0.5 size-4 shrink-0', verdict?.color)} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              {review.repo && (
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3" />
                  {subtitle}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileCode2 className="size-3" />
                {review.files_reviewed} file{review.files_reviewed !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {timeAgo(review.created_at)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {verdict && (
              <span className={cn('text-xs font-medium', verdict.color)}>{verdict.label}</span>
            )}
            <div className="flex gap-1.5 text-xs">
              {review.critical_count > 0 && (
                <span className="text-red-400">{review.critical_count}🔴</span>
              )}
              {review.warning_count > 0 && (
                <span className="text-amber-400">{review.warning_count}🟡</span>
              )}
              {review.total_issues === 0 && (
                <span className="text-emerald-500">Clean</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
