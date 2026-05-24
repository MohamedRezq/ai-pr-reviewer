'use client'

import { useState, useCallback, useRef } from 'react'
import { FileReviewCard } from './FileReviewCard'
import { DiffInput } from './DiffInput'
import { detectLanguage } from '@/lib/language-detector'
import type { SSEEvent, FileReviewState, OverallSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'

type AppState = 'idle' | 'streaming' | 'complete' | 'error'

type ExtendedSSEEvent = SSEEvent | { type: 'review_complete'; summary: OverallSummary; reviewId?: string }

interface ReviewStreamProps {
  isLoggedIn?: boolean
  githubToken?: string | null
  prUrl?: string
}

function buildMarkdown(files: FileReviewState[], summary: OverallSummary | null): string {
  const lines: string[] = ['# AI Code Review\n']
  if (summary) {
    lines.push(`## Summary\n${summary.summary}\n`)
    lines.push(`**Verdict:** ${summary.verdict.replace('_', ' ')} · **${summary.total_issues} total issues**\n`)
  }
  for (const f of files) {
    if (f.status !== 'complete' || !f.result) continue
    lines.push(`## \`${f.file}\`\n${f.result.file_summary}\n`)
    if (f.result.issues.length === 0) {
      lines.push('No issues found.\n')
    } else {
      for (const issue of f.result.issues) {
        const line = issue.line ? ` (L${issue.line})` : ''
        lines.push(`### ${issue.severity.toUpperCase()}: ${issue.title}${line}\n**Category:** ${issue.category}\n\n${issue.description}\n`)
      }
    }
  }
  return lines.join('\n')
}

export function ReviewStream({ isLoggedIn = false, githubToken, prUrl: initialPrUrl }: ReviewStreamProps) {
  const [appState, setAppState] = useState<AppState>('idle')
  const [fileStates, setFileStates] = useState<FileReviewState[]>([])
  const [summary, setSummary] = useState<OverallSummary | null>(null)
  const [savedReviewId, setSavedReviewId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postedUrl, setPostedUrl] = useState<string | null>(null)
  const [activePrUrl, setActivePrUrl] = useState<string | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)

  const reset = useCallback(() => {
    readerRef.current?.cancel()
    setAppState('idle')
    setFileStates([])
    setSummary(null)
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
    setTimeout(() => setCopied(false), 2000)
  }, [fileStates, summary])

  const handlePostToGitHub = useCallback(async () => {
    if (!activePrUrl || !githubToken) return
    setPosting(true)
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post to GitHub')
    } finally {
      setPosting(false)
    }
  }, [activePrUrl, githubToken, fileStates, summary])

  const startReview = useCallback(async (diff: string, prUrl?: string) => {
    reset()
    setAppState('streaming')
    if (prUrl) setActivePrUrl(prUrl)

    try {
      const body = prUrl
        ? JSON.stringify({ prUrl })
        : JSON.stringify({ diff })

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
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setAppState('error')
    }
  }, [reset]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleEvent(event: ExtendedSSEEvent) {
    switch (event.type) {
      case 'review_start':
        setFileStates(event.files.map((file) => ({ file, status: 'reviewing' })))
        break
      case 'file_complete':
        setFileStates((prev) =>
          prev.map((f) => f.file === event.file ? { ...f, status: 'complete', result: event.result } : f),
        )
        break
      case 'file_error':
        setFileStates((prev) =>
          prev.map((f) => f.file === event.file ? { ...f, status: 'error', error: event.error } : f),
        )
        break
      case 'review_complete': {
        setSummary(event.summary)
        if ('reviewId' in event && event.reviewId) setSavedReviewId(event.reviewId)
        setAppState('complete')
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

  if (appState === 'idle') {
    return <DiffInput onSubmit={startReview} isLoading={false} isLoggedIn={isLoggedIn} initialPrUrl={initialPrUrl} />
  }

  const verdictConfig = summary
    ? {
        approved: { icon: CheckCircle2, label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-800/50' },
        needs_changes: { icon: XCircle, label: 'Needs Changes', color: 'text-red-400', bg: 'bg-red-950/30 border-red-800/50' },
        nitpick: { icon: MessageSquare, label: 'Nitpick Only', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-800/50' },
      }[summary.verdict]
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Summary / progress */}
      {(summary || appState === 'streaming') && (
        <div className={cn('rounded-xl border p-5 transition-all duration-500', summary && verdictConfig ? verdictConfig.bg : 'border-zinc-800 bg-zinc-900/60')}>
          {summary && verdictConfig ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {(() => { const Icon = verdictConfig.icon; return <Icon className={cn('size-5', verdictConfig.color)} /> })()}
                  <span className={cn('font-semibold', verdictConfig.color)}>{verdictConfig.label}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-300">{summary.summary}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {summary.critical_count > 0 && <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-400">{summary.critical_count} critical</span>}
                {summary.warning_count > 0 && <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-medium text-amber-400">{summary.warning_count} warnings</span>}
                {summary.suggestion_count > 0 && <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-blue-400">{summary.suggestion_count} suggestions</span>}
                {summary.total_issues === 0 && <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-400">No issues</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Reviewing {completedFiles.length} of {fileStates.length} files…</span>
                <span className="text-sm text-zinc-500">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
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
            <a href={upgradeUrl} className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors">
              Upgrade
            </a>
          )}
        </div>
      )}

      {/* File cards */}
      {fileStates.length > 0 && (
        <div className="flex flex-col gap-3">
          {fileStates.map((f) => (
            <FileReviewCard key={f.file} file={f.file} language={detectLanguage(f.file)} status={f.status} result={f.result} error={f.error} />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          <RotateCcw className="size-4" />
          New Review
        </button>

        {appState === 'complete' && (
          <div className="flex flex-wrap items-center gap-2">
            {savedReviewId && (
              <a
                href={`/review/${savedReviewId}`}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                <BookMarked className="size-4" />
                Saved
              </a>
            )}

            {activePrUrl && githubToken && !postedUrl && (
              <button
                onClick={handlePostToGitHub}
                disabled={posting}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
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
                className="flex items-center gap-2 rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-2.5 text-sm text-emerald-400 transition-colors hover:border-emerald-700"
              >
                <ExternalLink className="size-4" />
                View on GitHub
              </a>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              {copied ? <><Check className="size-4 text-emerald-400" /><span className="text-emerald-400">Copied!</span></> : <><Copy className="size-4" />Copy Markdown</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
