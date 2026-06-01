'use client'

import { useState, useCallback, useRef } from 'react'
import { FileReviewCard } from './FileReviewCard'
import { DiffInput } from './DiffInput'
import { detectLanguage } from '@/lib/language-detector'
import type {
  SSEEvent,
  FileReviewState,
  OverallSummary,
  ConsensusResult,
  SimilarIssue,
  ReviewerSuggestion,
  ModelId,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { analytics } from '@/lib/analytics'
import { GitHubIcon } from '@/components/GitHubIcon'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  BookMarked,
  ExternalLink,
  Loader2,
  Zap,
  DollarSign,
  Users,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

type AppState = 'idle' | 'streaming' | 'complete' | 'error'

type ExtendedSSEEvent =
  | SSEEvent
  | { type: 'review_complete'; summary: OverallSummary; reviewId?: string }

interface ReviewStreamProps {
  isLoggedIn?: boolean
  githubToken?: string | null
  prUrl?: string
}

const MODEL_OPTIONS: { id: ModelId; label: string; badge: string; color: string }[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    badge: 'Recommended',
    color: 'bg-orange-950 text-orange-400 border-orange-900/50',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    badge: 'OpenAI',
    color: 'bg-emerald-950 text-emerald-400 border-emerald-900/50',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    badge: 'Google',
    color: 'bg-blue-950 text-blue-400 border-blue-900/50',
  },
]

function buildMarkdown(files: FileReviewState[], summary: OverallSummary | null): string {
  const lines: string[] = ['# AI Code Review\n']
  if (summary) {
    lines.push(`## Summary\n${summary.summary}\n`)
    lines.push(`**Verdict:** ${summary.verdict.replace('_', ' ')} · **${summary.total_issues} total issues**\n`)
    if (summary.total_cost_usd) {
      lines.push(`**Cost:** $${summary.total_cost_usd.toFixed(4)} USD\n`)
    }
  }
  for (const f of files) {
    if (f.status !== 'complete' || !f.result) continue
    lines.push(`## \`${f.file}\`\n${f.result.file_summary}\n`)
    if (f.result.issues.length === 0) {
      lines.push('No issues found.\n')
    } else {
      for (const issue of f.result.issues) {
        const line = issue.line ? ` (L${issue.line})` : ''
        lines.push(
          `### ${issue.severity.toUpperCase()}: ${issue.title}${line}\n**Category:** ${issue.category}\n\n${issue.description}\n`,
        )
      }
    }
  }
  return lines.join('\n')
}

function formatCost(usd: number): string {
  if (usd < 0.001) return `$${(usd * 1000).toFixed(3)}m`
  return `$${usd.toFixed(4)}`
}

export function ReviewStream({ isLoggedIn = false, githubToken, prUrl: initialPrUrl }: ReviewStreamProps) {
  const [appState, setAppState] = useState<AppState>('idle')
  const [fileStates, setFileStates] = useState<FileReviewState[]>([])
  const [summary, setSummary] = useState<OverallSummary | null>(null)
  const [reviewerBrief, setReviewerBrief] = useState<string | null>(null)
  const [savedReviewId, setSavedReviewId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postedUrl, setPostedUrl] = useState<string | null>(null)
  const [activePrUrl, setActivePrUrl] = useState<string | null>(null)
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(['claude-3-5-sonnet-20241022'])
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [briefExpanded, setBriefExpanded] = useState(true)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)

  const reset = useCallback(() => {
    readerRef.current?.cancel()
    setAppState('idle')
    setFileStates([])
    setSummary(null)
    setReviewerBrief(null)
    setSavedReviewId(null)
    setErrorMessage(null)
    setUpgradeUrl(null)
    setCopied(false)
    setPosting(false)
    setPostedUrl(null)
    setActivePrUrl(null)
  }, [])

  const handleCopy = useCallback(async () => {
    const md = buildMarkdown(fileStates, summary)
    await navigator.clipboard.writeText(md)
    setCopied(true)
    analytics.copyMarkdownClicked(savedReviewId ?? undefined)
    setTimeout(() => setCopied(false), 2000)
  }, [fileStates, summary, savedReviewId])

  const handlePostToGitHub = useCallback(async () => {
    if (!activePrUrl || !githubToken) return
    setPosting(true)
    analytics.postToGitHubClicked(activePrUrl ?? '')
    try {
      const body = buildMarkdown(fileStates, summary)
      const res = await fetch('/api/github/post-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl: activePrUrl, body }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const { url } = await res.json()
      setPostedUrl(url)
      analytics.postToGitHubSuccess(activePrUrl ?? '')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post to GitHub')
    } finally {
      setPosting(false)
    }
  }, [activePrUrl, githubToken, fileStates, summary])

  const toggleModel = useCallback((modelId: ModelId) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.length > 1 ? prev.filter((m) => m !== modelId) : prev
      }
      return [...prev, modelId]
    })
  }, [])

  const startReview = useCallback(
    async (diff: string, prUrl?: string) => {
      reset()
      setAppState('streaming')
      if (prUrl) setActivePrUrl(prUrl)

      try {
        const body = prUrl
          ? JSON.stringify({ prUrl, models: selectedModels })
          : JSON.stringify({ diff, models: selectedModels })

        const res = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Review failed' }))
          if (err.error === 'usage_limit_exceeded') {
            setErrorMessage(err.message)
            setUpgradeUrl(err.upgrade_url ?? '/settings/billing')
            setAppState('error')
            return
          }
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }

        if (!res.body) throw new Error('No response stream')

        const reader = res.body.getReader()
        readerRef.current = reader
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6)) as ExtendedSSEEvent
              handleEvent(event)
            } catch {
              /* skip malformed events */
            }
          }
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
        setAppState('error')
      }
    },
    [reset, selectedModels], // eslint-disable-line react-hooks/exhaustive-deps
  )

  function handleEvent(event: ExtendedSSEEvent) {
    switch (event.type) {
      case 'review_start':
        setFileStates(event.files.map((file) => ({ file, status: 'reviewing' })))
        break

      case 'file_start':
        setFileStates((prev) =>
          prev.map((f) =>
            f.file === event.file ? { ...f, status: 'reviewing', streamingText: '' } : f,
          ),
        )
        break

      case 'token_chunk':
        setFileStates((prev) =>
          prev.map((f) =>
            f.file === event.file
              ? { ...f, streamingText: (f.streamingText ?? '') + event.chunk }
              : f,
          ),
        )
        break

      case 'file_complete':
        setFileStates((prev) =>
          prev.map((f) =>
            f.file === event.file
              ? { ...f, status: 'complete', result: event.result, consensus: event.consensus, streamingText: undefined }
              : f,
          ),
        )
        break

      case 'file_error':
        setFileStates((prev) =>
          prev.map((f) =>
            f.file === event.file ? { ...f, status: 'error', error: event.error, streamingText: undefined } : f,
          ),
        )
        break

      case 'similar_issues':
        setFileStates((prev) =>
          prev.map((f) =>
            f.file === event.file ? { ...f, similarIssues: event.issues } : f,
          ),
        )
        break

      case 'reviewer_suggestion':
        setFileStates((prev) =>
          prev.map((f) =>
            f.file === event.file ? { ...f, reviewerSuggestion: event.suggestion } : f,
          ),
        )
        break

      case 'reviewer_brief':
        setReviewerBrief(event.brief)
        break

      case 'review_complete': {
        setSummary(event.summary)
        if ('reviewId' in event && event.reviewId) setSavedReviewId(event.reviewId)
        setAppState('complete')
        analytics.reviewCompleted({
          filesReviewed: event.summary.files_reviewed,
          issuesFound: event.summary.total_issues,
          costUsd: event.summary.total_cost_usd ?? 0,
          verdict: event.summary.verdict,
          durationMs: 0,
          modelsUsed: event.summary.models_used?.length ?? 1,
        })
        break
      }

      case 'error':
        setErrorMessage(event.message)
        setAppState('error')
        break
    }
  }

  const completedFiles = fileStates.filter((f) => f.status === 'complete' || f.status === 'error')
  const progress = fileStates.length > 0 ? completedFiles.length / fileStates.length : 0
  const isMultiModel = selectedModels.length > 1

  // ─── Idle state — show input + model selector ────────────────────────────

  if (appState === 'idle') {
    return (
      <div className="flex flex-col gap-4">
        {/* Model Selector */}
        <div>
          <button
            onClick={() => {
              setShowModelPicker((v) => !v)
            }}
            className="flex items-center gap-2 text-xs text-[--foreground] opacity-40 hover:opacity-70 transition-opacity"
          >
            <Sparkles className="size-3" />
            <span>
              {selectedModels.length === 1
                ? MODEL_OPTIONS.find((m) => m.id === selectedModels[0])?.label ?? 'Claude'
                : `${selectedModels.length} models (consensus)`}
            </span>
            {showModelPicker ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          {showModelPicker && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {MODEL_OPTIONS.map((opt) => {
                const active = selectedModels.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      toggleModel(opt.id)
                      analytics.modelSelected(selectedModels.length === 1 && !active ? 'consensus' : 'single')
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      active ? opt.color : 'border-[--border] bg-[--surface] text-[--foreground] opacity-50 hover:opacity-80',
                    )}
                  >
                    {opt.label}
                    {active && <Check className="size-3" />}
                  </button>
                )
              })}
              {isMultiModel && (
                <span className="self-center text-xs text-[--foreground] opacity-30">
                  · Higher accuracy, ~3× cost
                </span>
              )}
            </div>
          )}
        </div>

        <DiffInput onSubmit={startReview} isLoading={false} isLoggedIn={isLoggedIn} initialPrUrl={initialPrUrl} />
      </div>
    )
  }

  const verdictConfig = summary
    ? {
        approved: {
          icon: CheckCircle2,
          label: 'Approved',
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/30 border-emerald-800/50',
        },
        needs_changes: {
          icon: XCircle,
          label: 'Needs Changes',
          color: 'text-red-400',
          bg: 'bg-red-950/30 border-red-800/50',
        },
        nitpick: {
          icon: MessageSquare,
          label: 'Nitpick Only',
          color: 'text-blue-400',
          bg: 'bg-blue-950/30 border-blue-800/50',
        },
      }[summary.verdict]
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Summary / progress bar */}
      {(summary || appState === 'streaming') && (
        <div
          className={cn(
            'rounded-xl border p-5 transition-all duration-500',
            summary && verdictConfig
              ? verdictConfig.bg
              : 'border-[--border] bg-[--surface]',
          )}
        >
          {summary && verdictConfig ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = verdictConfig.icon
                    return <Icon className={cn('size-5', verdictConfig.color)} />
                  })()}
                  <span className={cn('font-semibold', verdictConfig.color)}>{verdictConfig.label}</span>
                  {summary.models_used && summary.models_used.length > 1 && (
                    <span className="rounded-full bg-violet-950 px-2 py-0.5 text-xs font-medium text-violet-400">
                      {summary.models_used.length} models
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-300">{summary.summary}</p>

                {/* Cost display */}
                {summary.total_cost_usd !== undefined && summary.total_cost_usd > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <DollarSign className="size-3" />
                    <span>
                      This review cost <span className="text-zinc-400 font-medium">{formatCost(summary.total_cost_usd)}</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {summary.critical_count > 0 && (
                  <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-400">
                    {summary.critical_count} critical
                  </span>
                )}
                {summary.warning_count > 0 && (
                  <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-medium text-amber-400">
                    {summary.warning_count} warnings
                  </span>
                )}
                {summary.suggestion_count > 0 && (
                  <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-blue-400">
                    {summary.suggestion_count} suggestions
                  </span>
                )}
                {summary.total_issues === 0 && (
                  <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-400">
                    No issues
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[--foreground] opacity-70">
                  Reviewing {completedFiles.length} of {fileStates.length} files…
                  {isMultiModel && <span className="ml-2 opacity-50">(consensus mode)</span>}
                </span>
                <span className="text-sm text-[--foreground] opacity-40">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[--border]">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Reviewer Brief */}
      {reviewerBrief && (
        <div className="rounded-xl border border-violet-900/50 bg-violet-950/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="size-4 shrink-0 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">AI Reviewer Brief</span>
              <span className="rounded-full bg-violet-950 px-2 py-0.5 text-xs text-violet-400">
                For human reviewers
              </span>
            </div>
            <button
              onClick={() => setBriefExpanded((v) => !v)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {briefExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
          {briefExpanded && (
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{reviewerBrief}</p>
          )}
        </div>
      )}

      {/* Error / usage limit */}
      {appState === 'error' && errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Review failed</p>
            <p className="mt-0.5 text-sm text-red-400/70">{errorMessage}</p>
          </div>
          {upgradeUrl && (
            <a
              href={upgradeUrl}
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>
      )}

      {/* File cards */}
      {fileStates.length > 0 && (
        <div className="flex flex-col gap-3">
          {fileStates.map((f) => (
            <FileReviewCardExtended key={f.file} state={f} isMultiModel={isMultiModel} />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-[--border] px-4 py-2.5 text-sm text-[--foreground] opacity-50 transition-all hover:opacity-100 hover:border-indigo-500/30"
        >
          <RotateCcw className="size-4" />
          New Review
        </button>

        {appState === 'complete' && (
          <div className="flex flex-wrap items-center gap-2">
            {savedReviewId && (
              <a
                href={`/review/${savedReviewId}`}
                className="flex items-center gap-2 rounded-xl border border-[--border] px-4 py-2.5 text-sm text-[--foreground] opacity-50 transition-all hover:opacity-100 hover:border-indigo-500/30"
              >
                <BookMarked className="size-4" />
                Saved
              </a>
            )}

            {activePrUrl && githubToken && !postedUrl && (
              <button
                onClick={handlePostToGitHub}
                disabled={posting}
                className="flex items-center gap-2 rounded-xl border border-[--border] px-4 py-2.5 text-sm text-[--foreground] opacity-50 transition-all hover:opacity-100 hover:border-indigo-500/30 disabled:opacity-25"
              >
                {posting ? <Loader2 className="size-4 animate-spin" /> : <GitHubIcon className="size-4" />}
                {posting ? 'Posting…' : 'Post to GitHub'}
              </button>
            )}

            {postedUrl && (
              <a
                href={postedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-400 transition-all hover:border-emerald-500/50"
              >
                <ExternalLink className="size-4" />
                View on GitHub
              </a>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-xl border border-[--border] px-4 py-2.5 text-sm text-[--foreground] opacity-50 transition-all hover:opacity-100 hover:border-indigo-500/30"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span className="text-emerald-400 opacity-100">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy Markdown
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Extended file card with consensus, similar issues, reviewer suggestion ──

interface FileReviewCardExtendedProps {
  state: FileReviewState
  isMultiModel: boolean
}

function FileReviewCardExtended({ state, isMultiModel }: FileReviewCardExtendedProps) {
  const [showSimilar, setShowSimilar] = useState(false)
  const language = detectLanguage(state.file)

  return (
    <div className="flex flex-col gap-2">
      {/* Streaming indicator */}
      {state.status === 'reviewing' && state.streamingText !== undefined && (
        <div className="rounded-xl border border-[--border] bg-[--surface] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="size-3.5 animate-spin text-indigo-400" />
            <span className="text-xs font-mono text-[--foreground] opacity-40 truncate">{state.file}</span>
          </div>
          <p className="text-xs text-[--foreground] opacity-30 font-mono leading-relaxed line-clamp-3">
            {state.streamingText || '…'}
            <span className="animate-pulse text-indigo-400 opacity-100">▌</span>
          </p>
        </div>
      )}

      {/* Completed file card */}
      {(state.status === 'complete' || state.status === 'error') && (
        <FileReviewCard
          file={state.file}
          language={language}
          status={state.status}
          result={state.result}
          error={state.error}
        />
      )}

      {/* Multi-model consensus badges */}
      {isMultiModel && state.consensus && state.status === 'complete' && (
        <ConsensusPanel consensus={state.consensus} />
      )}

      {/* Reviewer assignment suggestion */}
      {state.reviewerSuggestion && (
        <ReviewerBadge suggestion={state.reviewerSuggestion} />
      )}

      {/* Similar historical issues */}
      {state.similarIssues && state.similarIssues.length > 0 && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-4 py-3">
          <button
            onClick={() => setShowSimilar((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <History className="size-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">
                {state.similarIssues.length} similar issue{state.similarIssues.length > 1 ? 's' : ''} found in past reviews
              </span>
            </div>
            {showSimilar ? (
              <ChevronUp className="size-3.5 text-zinc-500" />
            ) : (
              <ChevronDown className="size-3.5 text-zinc-500" />
            )}
          </button>
          {showSimilar && (
            <div className="mt-2 flex flex-col gap-1.5">
              {state.similarIssues.map((si, i) => (
                <SimilarIssueRow key={i} issue={si} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConsensusPanel({ consensus }: { consensus: ConsensusResult }) {
  const agreementPct = Math.round(consensus.agreementScore * 100)
  return (
    <div className="rounded-lg border border-violet-900/30 bg-violet-950/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-3.5 text-violet-400" />
          <span className="text-xs font-medium text-violet-300">Model consensus</span>
        </div>
        <span
          className={cn(
            'text-xs font-semibold',
            agreementPct >= 80 ? 'text-emerald-400' : agreementPct >= 50 ? 'text-amber-400' : 'text-red-400',
          )}
        >
          {agreementPct}% agreement
        </span>
      </div>
      {consensus.issues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {consensus.issues.slice(0, 4).map((issue, i) => (
            <span
              key={i}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs border',
                issue.confidence === 'high'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-900/50'
                  : issue.confidence === 'medium'
                    ? 'bg-amber-950 text-amber-400 border-amber-900/50'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800',
              )}
              title={`Agreed by: ${issue.agreedBy.join(', ')}`}
            >
              {issue.confidence === 'high' ? '✓' : issue.confidence === 'medium' ? '~' : '?'} {issue.title.slice(0, 30)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewerBadge({ suggestion }: { suggestion: ReviewerSuggestion }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
      <Users className="size-3.5 text-zinc-500" />
      <span className="text-xs text-zinc-400">
        Suggest assigning to{' '}
        <span className="font-medium text-zinc-200">@{suggestion.suggestedReviewer}</span>
        {' '}— owns{' '}
        <span className="text-indigo-400">{suggestion.ownershipPct}%</span>
        {' '}of this module ({suggestion.recentCommits} recent commits)
      </span>
    </div>
  )
}

function SimilarIssueRow({ issue }: { issue: SimilarIssue }) {
  const daysAgo = Math.round(
    (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  )
  return (
    <div className="flex items-start gap-2 rounded bg-amber-950/20 px-3 py-2">
      <History className="mt-0.5 size-3 shrink-0 text-amber-500" />
      <div className="text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">{issue.issueTitle}</span>
        <span className="text-zinc-600 ml-1">
          — similar issue in{' '}
          <a href={`/review/${issue.reviewId}`} className="text-amber-400 hover:underline">
            PR review
          </a>
          {' '}({daysAgo}d ago, {issue.similarity}% match)
        </span>
      </div>
    </div>
  )
}
