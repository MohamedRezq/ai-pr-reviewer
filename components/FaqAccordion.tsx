'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem { q: string; a: string }

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60"
          >
            <span className={cn('text-sm font-semibold', open === i ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-600 dark:text-zinc-300')}>
              {item.q}
            </span>
            <ChevronDown className={cn('size-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-zinc-500', open === i && 'rotate-180')} />
          </button>
          {open === i && (
            <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
