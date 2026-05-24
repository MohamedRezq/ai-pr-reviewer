'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, LayoutDashboard, History, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { Plan } from '@/lib/supabase/types'

interface UserMenuProps {
  username: string | null
  avatarUrl: string | null
  plan: Plan
}

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-zinc-800 text-zinc-400',
  pro: 'bg-indigo-950 text-indigo-400',
  team: 'bg-violet-950 text-violet-400',
}

export function UserMenu({ username, avatarUrl, plan }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const signOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-900"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={username ?? 'User avatar'}
            className="size-7 rounded-full"
          />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {(username ?? 'U')[0].toUpperCase()}
          </div>
        )}
        <span className="hidden text-sm font-medium text-zinc-300 sm:block">
          {username ?? 'User'}
        </span>
        <span className={`hidden rounded-full px-1.5 py-0.5 text-xs font-medium sm:block ${PLAN_COLORS[plan]}`}>
          {plan}
        </span>
        <ChevronDown className={`size-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/50">
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="text-sm font-medium text-zinc-200">{username}</p>
            <p className="text-xs text-zinc-500">
              {plan === 'free' ? 'Free plan · 5 reviews/month' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`}
            </p>
          </div>

          <div className="py-1">
            {[
              { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { href: '/reviews', icon: History, label: 'Review History' },
              { href: '/settings', icon: Settings, label: 'Settings' },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-zinc-800 py-1">
            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-red-400"
            >
              <LogOut className="size-4" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
