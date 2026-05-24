import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReview } from '@/lib/supabase/db'
import { FileReviewCard } from '@/components/FileReviewCard'
import { detectLanguage } from '@/lib/language-detector'
import type { FileReviewResult } from '@/lib/types'
import type { Issue } from '@/lib/types'
import { CheckCircle2, XCircle, MessageSquare, ArrowLeft, GitBranch, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>
}

const VERDICT_CONFIG = {
  approved: { icon: CheckCircle2, label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-800/50' },
  needs_changes: { icon: XCircle, label: 'Needs Changes', color: 'text-red-400', bg: 'bg-red-950/30 border-red-800/50' },
  nitpick: { icon: MessageSquare, label: 'Nitpick Only', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-800/50' },
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirectTo=/review/${id}`)

  const review = await getReview(supabase, id, user.id)
  if (!review) notFound()

  const verdict = review.verdict ? VERDICT_CONFIG[review.verdict] : null
  const VerdictIcon = verdict?.icon

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Back */}
      <Link
        href="/reviews"
        className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to history
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              {review.pr_title ?? (review.pr_url ? `PR #${review.pr_number}` : 'Diff Review')}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
              {review.repo && (
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3.5" />
                  {review.repo}
                </span>
              )}
              <span>{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          {review.pr_url && (
            <a
              href={review.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              View PR
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {verdict && (
        <div className={`mb-6 rounded-xl border p-5 ${verdict.bg}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {VerdictIcon && <VerdictIcon className={`size-5 ${verdict.color}`} />}
                <span className={`font-semibold ${verdict.color}`}>{verdict.label}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-300">{review.overall_summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {review.critical_count > 0 && (
                <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-400">{review.critical_count} critical</span>
              )}
              {review.warning_count > 0 && (
                <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-medium text-amber-400">{review.warning_count} warnings</span>
              )}
              {review.suggestion_count > 0 && (
                <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-blue-400">{review.suggestion_count} suggestions</span>
              )}
              {review.total_issues === 0 && (
                <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-400">No issues</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File reviews */}
      <div className="flex flex-col gap-3">
        {review.files.map((file) => {
          const result: FileReviewResult = {
            file_summary: file.file_summary ?? '',
            issues: (file.issues as Issue[]) ?? [],
            verdict: file.verdict ?? 'approved',
          }
          return (
            <FileReviewCard
              key={file.id}
              file={file.file_path}
              language={detectLanguage(file.file_path)}
              status="complete"
              result={result}
            />
          )
        })}
      </div>
    </div>
  )
}
