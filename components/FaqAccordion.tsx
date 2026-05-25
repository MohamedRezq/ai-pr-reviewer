'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem {
  q: string
  a: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-zinc-900/60"
          >
            <span className={cn('text-sm font-medium', open === i ? 'text-zinc-100' : 'text-zinc-300')}>
              {item.q}
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-zinc-500 transition-transform duration-200',
                open === i && 'rotate-180',
              )}
            />
          </button>
          {open === i && (
            <div className="border-t border-zinc-800/60 bg-zinc-900/30 px-6 py-4">
              <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
