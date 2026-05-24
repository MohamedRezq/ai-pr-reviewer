import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/db'
import { UserMenu } from '@/components/UserMenu'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI PR Reviewer — Code review powered by Claude',
  description:
    'Paste any git diff and get an instant, structured code review powered by Claude AI.',
  openGraph: {
    title: 'AI PR Reviewer',
    description: 'Instant AI code review for any git diff',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user ?? null

    if (user) {
      profile = await getProfile(supabase, user.id)
    }
  } catch {
    // Supabase not configured — app still works in anonymous mode
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 antialiased`}>
        {/* Nav */}
        <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  AI
                </div>
                <span className="font-semibold text-zinc-100">PR Reviewer</span>
                <span className="rounded-full bg-indigo-950 px-2 py-0.5 text-xs font-medium text-indigo-400">
                  beta
                </span>
              </Link>

              {user && (
                <nav className="hidden items-center gap-4 sm:flex">
                  <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/reviews" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                    History
                  </Link>
                </nav>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user && profile ? (
                <UserMenu
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  plan={profile.plan}
                />
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-zinc-900 py-8">
          <div className="mx-auto max-w-5xl px-4 text-center text-xs text-zinc-600">
            <p>
              AI PR Reviewer · Powered by{' '}
              <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500">
                Anthropic Claude
              </a>
              {' · '}
              <Link href="/settings/billing" className="hover:text-zinc-500">Pricing</Link>
              {' · '}
              Diffs are never stored
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
