'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IssueItem } from './IssueItem'
import { getLanguageColor } from '@/lib/language-detector'
import type { FileReviewResult } from '@/lib/types'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  FileCode2,
  AlertOctagon,
} from 'lucide-react'

interface FileReviewCardProps {
  file: string
  language: string
  status: 'pending' | 'reviewing' | 'complete' | 'error'
  result?: FileReviewResult
  error?: string
}

const VERDICT_CONFIG = {
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    className: 'text-emerald-400',
    border: 'border-emerald-900/40',
  },
  needs_changes: {
    icon: XCircle,
    label: 'Needs Changes',
    className: 'text-red-400',
    border: 'border-red-900/40',
  },
  nitpick: {
    icon: MessageSquare,
    label: 'Nitpick',
    className: 'text-blue-400',
    border: 'border-blue-900/40',
  },
}

export function FileReviewCard({ file, language, status, result, error }: FileReviewCardProps) {
  const [expanded, setExpanded] = useState(true)
  const filename = file.split('/').pop() ?? file
  const directory = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : ''
  const langColor = getLanguageColor(language)

  const criticalCount = result?.issues.filter((i) => i.severity === 'critical').length ?? 0
  const warningCount = result?.issues.filter((i) => i.severity === 'warning').length ?? 0
  const suggestionCount = result?.issues.filter((i) => i.severity === 'suggestion').length ?? 0
  const totalIssues = result?.issues.length ?? 0

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null
  const VerdictIcon = verdict?.icon

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-zinc-900/60 transition-all duration-300',
        status === 'pending' && 'border-zinc-800 opacity-50',
        status === 'reviewing' && 'border-zinc-700 animate-pulse-subtle',
        status === 'complete' && verdict?.border,
        status === 'complete' && !verdict && 'border-zinc-700',
        status === 'error' && 'border-red-900/40',
      )}
    >
      {/* Header */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50"
        onClick={() => status === 'complete' && setExpanded((e) => !e)}
        disabled={status !== 'complete'}
      >
        {/* Status indicator */}
        <div className="shrink-0">
          {status === 'pending' && (
            <FileCode2 className="size-4 text-zinc-600" />
          )}
          {status === 'reviewing' && (
            <Loader2 className="size-4 animate-spin text-zinc-400" />
          )}
          {status === 'complete' && VerdictIcon && (
            <VerdictIcon className={cn('size-4', verdict?.className)} />
          )}
          {status === 'error' && (
            <AlertOctagon className="size-4 text-red-500" />
          )}
        </div>

        {/* File path */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm">
              {directory && <span className="text-zinc-500">{directory}</span>}
              <span className="font-medium text-zinc-100">{filename}</span>
            </span>
            <span
              className="hidden shrink-0 rounded px-1.5 py-0.5 text-xs font-medium sm:block"
              style={{ backgroundColor: `${langColor}20`, color: langColor }}
            >
              {language}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          {status === 'reviewing' && (
            <span className="text-xs text-zinc-500">Reviewing…</span>
          )}
          {status === 'complete' && (
            <>
              {criticalCount > 0 && (
                <span className="rounded-full bg-red-950 px-2 py-0.5 text-xs font-medium text-red-400">
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="rounded-full bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-400">
                  {warningCount} warn
                </span>
              )}
              {suggestionCount > 0 && (
                <span className="rounded-full bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-400">
                  {suggestionCount}
                </span>
              )}
              {totalIssues === 0 && (
                <span className="text-xs text-emerald-500">Clean</span>
              )}
              {expanded ? (
                <ChevronDown className="size-4 text-zinc-500" />
              ) : (
                <ChevronRight className="size-4 text-zinc-500" />
              )}
            </>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-400">Error</span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {status === 'complete' && expanded && result && (
        <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
          {/* File summary */}
          <p className="mb-3 text-sm text-zinc-400">{result.file_summary}</p>

          {/* Issues */}
          {result.issues.length > 0 ? (
            <div className="flex flex-col gap-2">
              {result.issues.map((issue, i) => (
                <IssueItem key={i} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm text-emerald-400">No issues found in this file</span>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="border-t border-red-900/30 px-4 pb-4 pt-3">
          <p className="text-sm text-red-400">{error ?? 'Failed to review this file.'}</p>
        </div>
      )}
    </div>
  )
}
