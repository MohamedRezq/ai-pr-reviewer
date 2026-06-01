import { parseDiff, summarizeDiff } from '@/lib/diff-parser'
import { shouldSkipFile, getSkipReason } from '@/lib/file-filters'
import { detectLanguage } from '@/lib/language-detector'
import { reviewFileStreaming, reviewFile, generateReviewerBrief } from '@/lib/anthropic'
import { reviewFileOpenAI } from '@/lib/openai'
import { reviewFileGemini } from '@/lib/gemini'
import { buildConsensus } from '@/lib/consensus'
import { shouldReviewFile } from '@/lib/path-filter'
import { getReviewerSuggestion } from '@/lib/git-blame'
import {
  parsePrUrl,
  fetchPrMeta,
  fetchPrFiles,
  buildDiffFromFiles,
} from '@/lib/github'
import type {
  SSEEvent,
  OverallSummary,
  FileReviewResult,
  FileReviewState,
  ModelId,
  SimilarIssue,
} from '@/lib/types'
import { PLAN_LIMITS } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_FILES = 50
const MAX_DIFF_BYTES = 500_000

function encode(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

async function getUserSession(req: Request) {
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
  costRecords: Array<{ model: string; file_path?: string; input_tokens: number; output_tokens: number; cost_usd: number }>,
): Promise<string | null> {
  if (!session) return null
  try {
    const { saveReview, incrementUsage, saveCosts } = await import('@/lib/supabase/db')
    await incrementUsage(session.supabase, session.user.id)
    const reviewId = await saveReview(session.supabase, session.user.id, files, summary, meta)
    if (reviewId && costRecords.length > 0) {
      await saveCosts(
        session.supabase,
        costRecords.map((c) => ({ ...c, review_id: reviewId, user_id: session.user.id })),
      )
    }
    return reviewId
  } catch {
    return null
  }
}

interface StreamOptions {
  diff: string
  models: ModelId[]
  prContext?: { title?: string; body?: string }
  meta?: { prUrl?: string; prTitle?: string; repo?: string; prNumber?: number }
  session?: Awaited<ReturnType<typeof getUserSession>>
  customRules?: string[]
  pathIncludes?: string[]
  pathExcludes?: string[]
  repoOwner?: string
  repoName?: string
}

function makeStream(opts: StreamOptions): ReadableStream<Uint8Array> {
  const {
    diff,
    models,
    prContext,
    meta,
    session,
    customRules = [],
    pathIncludes = [],
    pathExcludes = [],
    repoOwner,
    repoName,
  } = opts
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(encoder.encode(encode(event)))

      try {
        const allFiles = parseDiff(diff)
        const reviewable = allFiles.filter((f) => !shouldSkipFile(f.path))
        const skipped = allFiles.filter((f) => shouldSkipFile(f.path))

        // Apply path filters (per-repo settings)
        const pathFiltered = reviewable.filter((f) =>
          shouldReviewFile(f.path, pathIncludes, pathExcludes),
        )
        const pathSkipped = reviewable.filter(
          (f) => !shouldReviewFile(f.path, pathIncludes, pathExcludes),
        )

        const toReview = pathFiltered.slice(0, MAX_FILES)
        const totalSkipped = skipped.length + pathSkipped.length

        if (toReview.length === 0) {
          send({
            type: 'error',
            message:
              totalSkipped > 0
                ? `All ${totalSkipped} file(s) were skipped (lock files, binaries, generated code, or path filters).`
                : 'No files found. Paste a valid unified diff.',
          })
          controller.close()
          return
        }

        const primaryModel = models[0] ?? 'claude-3-5-sonnet-20241022'
        send({
          type: 'review_start',
          total: toReview.length,
          files: toReview.map((f) => f.path),
          models,
        })

        const results = new Map<string, FileReviewResult>()
        const errors = new Map<string, string>()
        const fileStates: FileReviewState[] = []
        const costRecords: Array<{
          model: string
          file_path: string
          input_tokens: number
          output_tokens: number
          cost_usd: number
        }> = []

        // Fetch custom rules once
        let activeRules: string[] = customRules
        if (session && activeRules.length === 0) {
          try {
            const { getUserRules } = await import('@/lib/supabase/db')
            const rulesData = await getUserRules(session.supabase, session.user.id, meta?.repo)
            activeRules = rulesData.map((r) => r.rule_text)
          } catch { /* rules are optional */ }
        }

        await Promise.allSettled(
          toReview.map(async (file) => {
            const language = detectLanguage(file.path)
            send({ type: 'file_start', file: file.path })

            try {
              let result: FileReviewResult

              if (models.length === 1 && primaryModel === 'claude-3-5-sonnet-20241022') {
                // Single-model streaming (typewriter effect)
                result = await reviewFileStreaming(
                  file.path,
                  language,
                  file.patch,
                  (chunk) => send({ type: 'token_chunk', file: file.path, chunk, model: primaryModel }),
                  prContext,
                  activeRules,
                )
              } else {
                // Multi-model: run all models in parallel, no token streaming for non-Claude models
                const modelPromises = models.map(async (modelId) => {
                  if (modelId === 'claude-3-5-sonnet-20241022') {
                    return reviewFileStreaming(
                      file.path,
                      language,
                      file.patch,
                      (chunk) => send({ type: 'token_chunk', file: file.path, chunk, model: modelId }),
                      prContext,
                      activeRules,
                    )
                  } else if (modelId === 'gpt-4.1' && process.env.OPENAI_API_KEY) {
                    return reviewFileOpenAI(file.path, language, file.patch, prContext, activeRules)
                  } else if (modelId === 'gemini-2.0-flash' && process.env.GOOGLE_AI_API_KEY) {
                    return reviewFileGemini(file.path, language, file.patch, prContext, activeRules)
                  }
                  return null
                })

                const modelResults = (await Promise.allSettled(modelPromises))
                  .filter((r): r is PromiseFulfilledResult<FileReviewResult | null> => r.status === 'fulfilled')
                  .map((r) => r.value)
                  .filter((r): r is FileReviewResult => r !== null)

                if (modelResults.length === 0) {
                  throw new Error(
                    'No models could run. Ensure ANTHROPIC_API_KEY is set, or add OPENAI_API_KEY / GOOGLE_AI_API_KEY for extra models.',
                  )
                }

                const consensus = buildConsensus(modelResults)
                result = {
                  ...consensus,
                  model: primaryModel,
                  usage: modelResults[0]?.usage,
                }

                // Collect costs from all models
                for (const mr of modelResults) {
                  if (mr.usage) {
                    costRecords.push({
                      model: mr.model ?? primaryModel,
                      file_path: file.path,
                      input_tokens: mr.usage.input_tokens,
                      output_tokens: mr.usage.output_tokens,
                      cost_usd: mr.usage.cost_usd,
                    })
                  }
                }

                results.set(file.path, result)
                fileStates.push({ file: file.path, status: 'complete', result, consensus })
                send({ type: 'file_complete', file: file.path, result, consensus })

                // Reviewer assignment suggestion
                if (repoOwner && repoName) {
                  const suggestion = await getReviewerSuggestion(
                    repoOwner,
                    repoName,
                    file.path,
                    session?.githubToken ?? undefined,
                  ).catch(() => null)
                  if (suggestion) {
                    send({ type: 'reviewer_suggestion', file: file.path, suggestion })
                  }
                }

                return
              }

              // Single-model path — collect cost
              if (result.usage) {
                costRecords.push({
                  model: result.model ?? primaryModel,
                  file_path: file.path,
                  input_tokens: result.usage.input_tokens,
                  output_tokens: result.usage.output_tokens,
                  cost_usd: result.usage.cost_usd,
                })
              }

              results.set(file.path, result)
              fileStates.push({ file: file.path, status: 'complete', result })
              send({ type: 'file_complete', file: file.path, result })

              // Reviewer assignment suggestion
              if (repoOwner && repoName) {
                const suggestion = await getReviewerSuggestion(
                  repoOwner,
                  repoName,
                  file.path,
                  session?.githubToken ?? undefined,
                ).catch(() => null)
                if (suggestion) {
                  send({ type: 'reviewer_suggestion', file: file.path, suggestion })
                }
              }

              // Historical similarity search
              if (session && process.env.OPENAI_API_KEY && result.issues.length > 0) {
                try {
                  const { embedIssues } = await import('@/lib/embeddings')
                  const { findSimilarIssues, saveIssueEmbeddings } = await import('@/lib/supabase/db')

                  const embeddingInputs = result.issues.map((issue) => ({
                    issue,
                    filePath: file.path,
                  }))
                  const embedded = await embedIssues(embeddingInputs)

                  const reviewId = 'temp' // will be replaced after save
                  const similarResults: SimilarIssue[] = []

                  for (const { issue, embedding } of embedded) {
                    const similars = await findSimilarIssues(
                      session.supabase,
                      session.user.id,
                      embedding,
                    )
                    for (const s of similars) {
                      similarResults.push({
                        issueTitle: issue.title,
                        filePath: s.file_path,
                        reviewId: s.review_id,
                        similarity: Math.round(s.similarity * 100),
                        createdAt: s.created_at,
                      })
                    }

                    // Store embedding for future use
                    await saveIssueEmbeddings(session.supabase, [
                      {
                        review_id: reviewId,
                        user_id: session.user.id,
                        file_path: file.path,
                        issue_title: issue.title,
                        issue_text: `${issue.title}: ${issue.description}`,
                        severity: issue.severity,
                        category: issue.category,
                        embedding,
                      },
                    ])
                  }

                  if (similarResults.length > 0) {
                    send({ type: 'similar_issues', file: file.path, issues: similarResults })
                  }
                } catch { /* embeddings are optional */ }
              }
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
        let totalCostUsd = 0

        for (const r of results.values()) {
          totalIssues += r.issues.length
          verdicts.push(r.verdict)
          if (r.usage) totalCostUsd += r.usage.cost_usd
          for (const i of r.issues) {
            if (i.severity === 'critical') critical++
            else if (i.severity === 'warning') warning++
            else if (i.severity === 'suggestion') suggestion++
            else info++
          }
        }
        // Add costs from multi-model records
        for (const c of costRecords) totalCostUsd += c.cost_usd

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

        if (skipped.length + pathSkipped.length > 0) {
          const reasons = [...new Set([
            ...skipped.map((f) => getSkipReason(f.path)),
            ...(pathSkipped.length > 0 ? ['path filter'] : []),
          ])]
          summaryText += ` (${skipped.length + pathSkipped.length} file${skipped.length + pathSkipped.length > 1 ? 's' : ''} skipped: ${reasons.join(', ')})`
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
          files_skipped: totalSkipped + errors.size,
          models_used: models,
          total_cost_usd: totalCostUsd,
        }

        // Generate AI reviewer brief
        const briefFiles = fileStates
          .filter((f) => f.status === 'complete' && f.result)
          .map((f) => ({
            path: f.file,
            issues: f.result!.issues.map((i) => ({
              severity: i.severity,
              title: i.title,
              line: i.line,
            })),
          }))

        try {
          const brief = await generateReviewerBrief(briefFiles)
          if (brief) send({ type: 'reviewer_brief', brief })
        } catch { /* brief is optional */ }

        const reviewId = await saveReviewResult(
          session ?? null,
          fileStates,
          summary,
          meta ?? {},
          costRecords,
        )
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
    models?: ModelId[]
    customRules?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prUrl, prContext, customRules } = body
  const models: ModelId[] = (body.models && body.models.length > 0)
    ? body.models
    : ['claude-3-5-sonnet-20241022']
  let { diff } = body
  let meta: { prUrl?: string; prTitle?: string; repo?: string; prNumber?: number } = {}
  let session: Awaited<ReturnType<typeof getUserSession>> = null
  let repoOwner: string | undefined
  let repoName: string | undefined
  let pathIncludes: string[] = []
  let pathExcludes: string[] = []

  session = await getUserSession(req)

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

  if (prUrl) {
    const parsed = parsePrUrl(prUrl)
    if (!parsed) {
      return Response.json({ error: 'Invalid GitHub PR URL' }, { status: 400 })
    }

    repoOwner = parsed.owner
    repoName = parsed.repo

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

      // Load per-repo path filters
      if (session) {
        try {
          const { getRepoSettings } = await import('@/lib/supabase/db')
          const repoSettings = await getRepoSettings(
            session.supabase,
            session.user.id,
            `${parsed.owner}/${parsed.repo}`,
          )
          if (repoSettings) {
            pathIncludes = repoSettings.path_includes
            pathExcludes = repoSettings.path_excludes
            // Override models from repo settings if not explicitly provided in request
            if (!body.models && repoSettings.models?.length > 0) {
              models.splice(0, models.length, ...repoSettings.models as ModelId[])
            }
          }
        } catch { /* repo settings are optional */ }
      }

      const contextFromPr = { title: prMeta.title, body: prMeta.body }
      return new Response(
        makeStream({
          diff,
          models,
          prContext: contextFromPr,
          meta,
          session,
          pathIncludes,
          pathExcludes,
          repoOwner,
          repoName,
        }),
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

  return new Response(
    makeStream({ diff: diff.trim(), models, prContext, meta, session, customRules }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    },
  )
}
