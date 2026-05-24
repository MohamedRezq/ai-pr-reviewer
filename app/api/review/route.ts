import { parseDiff, summarizeDiff } from '@/lib/diff-parser'
import { shouldSkipFile, getSkipReason } from '@/lib/file-filters'
import { detectLanguage } from '@/lib/language-detector'
import { reviewFile } from '@/lib/anthropic'
import {
  parsePrUrl,
  fetchPrMeta,
  fetchPrFiles,
  buildDiffFromFiles,
} from '@/lib/github'
import type { SSEEvent, OverallSummary, FileReviewResult, FileReviewState } from '@/lib/types'
import { PLAN_LIMITS } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_FILES = 50
const MAX_DIFF_BYTES = 500_000

function encode(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

async function getUserSession(req: Request) {
  // Only attempt if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: { session } } = await supabase.auth.getSession()
    const { getProfile, checkUsageLimit, incrementUsage } = await import('@/lib/supabase/db')
    const profile = await getProfile(supabase, user.id)
    const usage = await checkUsageLimit(supabase, user.id)

    return {
      user,
      profile,
      usage,
      githubToken: session?.provider_token ?? null,
      supabase,
      incrementUsage: () => incrementUsage(supabase, user.id),
    }
  } catch {
    return null
  }
}

async function saveReviewResult(
  session: Awaited<ReturnType<typeof getUserSession>>,
  files: FileReviewState[],
  summary: OverallSummary,
  meta: { prUrl?: string; prTitle?: string; repo?: string; prNumber?: number },
): Promise<string | null> {
  if (!session) return null
  try {
    const { saveReview, incrementUsage } = await import('@/lib/supabase/db')
    await incrementUsage(session.supabase, session.user.id)
    return await saveReview(session.supabase, session.user.id, files, summary, meta)
  } catch {
    return null
  }
}

function makeStream(
  diff: string,
  prContext?: { title?: string; body?: string },
  meta?: { prUrl?: string; prTitle?: string; repo?: string; prNumber?: number },
  session?: Awaited<ReturnType<typeof getUserSession>>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(encoder.encode(encode(event)))

      try {
        const allFiles = parseDiff(diff)
        const reviewable = allFiles.filter((f) => !shouldSkipFile(f.path))
        const skipped = allFiles.filter((f) => shouldSkipFile(f.path))
        const toReview = reviewable.slice(0, MAX_FILES)

        if (toReview.length === 0) {
          send({
            type: 'error',
            message: skipped.length > 0
              ? `All ${skipped.length} file(s) were skipped (lock files, binaries, generated code).`
              : 'No files found. Paste a valid unified diff.',
          })
          controller.close()
          return
        }

        send({ type: 'review_start', total: toReview.length, files: toReview.map((f) => f.path) })

        const results = new Map<string, FileReviewResult>()
        const errors = new Map<string, string>()
        const fileStates: FileReviewState[] = []

        await Promise.allSettled(
          toReview.map(async (file) => {
            const language = detectLanguage(file.path)
            try {
              const result = await reviewFile(file.path, language, file.patch, prContext)
              results.set(file.path, result)
              fileStates.push({ file: file.path, status: 'complete', result })
              send({ type: 'file_complete', file: file.path, result })
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Review failed'
              errors.set(file.path, message)
              fileStates.push({ file: file.path, status: 'error', error: message })
              send({ type: 'file_error', file: file.path, error: message })
            }
          }),
        )

        let totalIssues = 0, critical = 0, warning = 0, suggestion = 0, info = 0
        const verdicts: string[] = []

        for (const r of results.values()) {
          totalIssues += r.issues.length
          verdicts.push(r.verdict)
          for (const i of r.issues) {
            if (i.severity === 'critical') critical++
            else if (i.severity === 'warning') warning++
            else if (i.severity === 'suggestion') suggestion++
            else info++
          }
        }

        const overallVerdict =
          verdicts.includes('needs_changes') || critical > 0
            ? 'needs_changes'
            : verdicts.includes('nitpick') ? 'nitpick' : 'approved'

        let summaryText = critical > 0
          ? `Found ${critical} critical issue${critical > 1 ? 's' : ''} that should be fixed before merging.`
          : warning > 0
            ? `Found ${warning} warning${warning > 1 ? 's' : ''} worth addressing.`
            : totalIssues > 0
              ? `Found ${totalIssues} minor suggestion${totalIssues > 1 ? 's' : ''}.`
              : `No issues found. ${summarizeDiff(toReview)}.`

        if (skipped.length > 0) {
          const reasons = [...new Set(skipped.map((f) => getSkipReason(f.path)))]
          summaryText += ` (${skipped.length} file${skipped.length > 1 ? 's' : ''} skipped: ${reasons.join(', ')})`
        }

        const summary: OverallSummary = {
          summary: summaryText,
          verdict: overallVerdict,
          total_issues: totalIssues,
          critical_count: critical,
          warning_count: warning,
          suggestion_count: suggestion,
          info_count: info,
          files_reviewed: results.size,
          files_skipped: skipped.length + errors.size,
        }

        const reviewId = await saveReviewResult(session ?? null, fileStates, summary, meta ?? {})
        send({ type: 'review_complete', summary, ...(reviewId ? { reviewId } : {}) } as SSEEvent)
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'An unexpected error occurred' })
      } finally {
        controller.close()
      }
    },
  })
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  let body: {
    diff?: string
    prUrl?: string
    prContext?: { title?: string; body?: string }
  }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prUrl, prContext } = body
  let { diff } = body
  let meta: { prUrl?: string; prTitle?: string; repo?: string; prNumber?: number } = {}
  let session: Awaited<ReturnType<typeof getUserSession>> = null

  // Get user session for usage limits and saving
  session = await getUserSession(req)

  // Check usage limits for authenticated users
  if (session) {
    const { usage } = session
    if (!usage.allowed) {
      const planLimit = PLAN_LIMITS[session.profile?.plan ?? 'free']
      return Response.json(
        {
          error: 'usage_limit_exceeded',
          message: `You've used all ${planLimit} reviews this month. Upgrade to Pro for unlimited reviews.`,
          resetAt: usage.resetAt,
          upgrade_url: '/settings/billing',
        },
        { status: 429 },
      )
    }
  }

  // Fetch diff from GitHub if PR URL provided
  if (prUrl) {
    const parsed = parsePrUrl(prUrl)
    if (!parsed) {
      return Response.json({ error: 'Invalid GitHub PR URL' }, { status: 400 })
    }

    const githubToken = session?.githubToken ?? undefined
    try {
      const [prMeta, prFiles] = await Promise.all([
        fetchPrMeta(parsed.owner, parsed.repo, parsed.number, githubToken),
        fetchPrFiles(parsed.owner, parsed.repo, parsed.number, githubToken),
      ])

      diff = buildDiffFromFiles(prFiles, prMeta)
      meta = {
        prUrl,
        prTitle: prMeta.title,
        repo: `${parsed.owner}/${parsed.repo}`,
        prNumber: parsed.number,
      }

      const contextFromPr = { title: prMeta.title, body: prMeta.body }
      return new Response(
        makeStream(diff, contextFromPr, meta, session),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
          },
        },
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch PR'
      return Response.json({ error: message }, { status: 400 })
    }
  }

  if (!diff || typeof diff !== 'string') {
    return Response.json({ error: 'diff or prUrl is required' }, { status: 400 })
  }

  if (diff.length > MAX_DIFF_BYTES) {
    return Response.json(
      { error: `Diff too large (${Math.round(diff.length / 1024)}KB). Max is ${MAX_DIFF_BYTES / 1024}KB.` },
      { status: 413 },
    )
  }

  return new Response(makeStream(diff.trim(), prContext, meta, session), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
