'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem { q: string; a: string }

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-[--border] bg-[--surface] transition-colors"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[--background]/50 transition-colors"
          >
            <span className={cn(
              'text-sm font-medium transition-colors',
              open === i ? 'text-[--foreground]' : 'text-[--foreground] opacity-65'
            )}>
              {item.q}
            </span>
            <ChevronDown className={cn(
              'size-4 shrink-0 text-[--foreground] opacity-30 transition-transform duration-200',
              open === i && 'rotate-180 opacity-60'
            )} />
          </button>
          {open === i && (
            <div className="border-t border-[--border] px-5 py-4">
              <p className="text-sm leading-relaxed text-[--foreground] opacity-55">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
