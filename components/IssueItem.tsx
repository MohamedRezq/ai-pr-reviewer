'use client'

import { cn } from '@/lib/utils'
import type { Issue } from '@/lib/types'
import {
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Info,
  Bug,
  ShieldAlert,
  Zap,
  Wrench,
  Palette,
} from 'lucide-react'

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    label: 'Critical',
    className: 'text-red-400 bg-red-950/40 border-red-900/50',
    badge: 'bg-red-950 text-red-400 border-red-900/60',
    dot: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'text-amber-400 bg-amber-950/30 border-amber-900/40',
    badge: 'bg-amber-950 text-amber-400 border-amber-900/60',
    dot: 'bg-amber-500',
  },
  suggestion: {
    icon: Lightbulb,
    label: 'Suggestion',
    className: 'text-blue-400 bg-blue-950/30 border-blue-900/40',
    badge: 'bg-blue-950 text-blue-400 border-blue-900/60',
    dot: 'bg-blue-500',
  },
  info: {
    icon: Info,
    label: 'Info',
    className: 'text-zinc-400 bg-zinc-900/40 border-zinc-800/50',
    badge: 'bg-zinc-900 text-zinc-400 border-zinc-700/60',
    dot: 'bg-zinc-500',
  },
} as const

const CATEGORY_CONFIG = {
  bug: { icon: Bug, label: 'Bug' },
  security: { icon: ShieldAlert, label: 'Security' },
  performance: { icon: Zap, label: 'Performance' },
  maintainability: { icon: Wrench, label: 'Maintainability' },
  style: { icon: Palette, label: 'Style' },
} as const

interface IssueItemProps {
  issue: Issue
}

export function IssueItem({ issue }: IssueItemProps) {
  const sev = SEVERITY_CONFIG[issue.severity]
  const cat = CATEGORY_CONFIG[issue.category]
  const SeverityIcon = sev.icon
  const CategoryIcon = cat.icon

  return (
    <div className={cn('rounded-lg border p-4 transition-colors', sev.className)}>
      <div className="flex items-start gap-3">
        <SeverityIcon className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium leading-snug">{issue.title}</span>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                  sev.badge,
                )}
              >
                {sev.label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                  sev.badge,
                )}
              >
                <CategoryIcon className="size-3" />
                {cat.label}
              </span>
              {issue.line && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-400">
                  L{issue.line}{issue.end_line && issue.end_line !== issue.line ? `–${issue.end_line}` : ''}
                </span>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed opacity-85">{issue.description}</p>
        </div>
      </div>
    </div>
  )
}
