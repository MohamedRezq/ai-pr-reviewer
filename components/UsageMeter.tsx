import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/supabase/types'
import { PLAN_LIMITS } from '@/lib/supabase/types'

interface UsageMeterProps {
  used: number
  plan: Plan
  resetAt: string
  compact?: boolean
}

export function UsageMeter({ used, plan, resetAt, compact = false }: UsageMeterProps) {
  const limit = PLAN_LIMITS[plan]

  if (limit === null) {
    if (compact) return null
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2 rounded-full bg-emerald-500" />
        <span className="text-zinc-400">Unlimited reviews</span>
      </div>
    )
  }

  const percent = Math.min(100, (used / limit) * 100)
  const remaining = Math.max(0, limit - used)
  const resetDate = new Date(resetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const color =
    percent >= 100
      ? 'bg-red-500'
      : percent >= 80
        ? 'bg-amber-500'
        : 'bg-indigo-500'

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
          <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-zinc-500">{used}/{limit}</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-200">Monthly Reviews</p>
          <p className="text-xs text-zinc-500">Resets {resetDate}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-zinc-100">{used}</p>
          <p className="text-xs text-zinc-500">of {limit}</p>
        </div>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percent}%` }}
        />
      </div>

      {percent >= 100 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-red-400">Limit reached</p>
          <Link
            href="/settings/billing"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          {remaining} review{remaining !== 1 ? 's' : ''} remaining this month
          {percent >= 80 && (
            <Link href="/settings/billing" className="ml-2 text-indigo-400 hover:underline">
              Upgrade
            </Link>
          )}
        </p>
      )}
    </div>
  )
}
