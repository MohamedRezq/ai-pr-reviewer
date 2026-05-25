import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/db'
import { UserMenu } from '@/components/UserMenu'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getprova.dev'
const APP_NAME = 'Prova'
const APP_DESCRIPTION =
  'AI-powered code review that streams results file-by-file. Multi-model consensus from Claude, GPT-4.1, and Gemini. Team coaching, cost transparency, custom rules — no YAML required.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — AI Code Review for Pull Requests`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'AI code review',
    'pull request review',
    'automated code review',
    'Claude code review',
    'GPT-4 code review',
    'multi-model code review',
    'GitHub PR review',
    'code quality tool',
    'security code review',
    'streaming code review',
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — AI Code Review, in seconds`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — AI Code Review powered by Claude, GPT-4.1, and Gemini`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — AI Code Review, in seconds`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: APP_NAME,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: APP_DESCRIPTION,
  url: APP_URL,
  featureList: [
    'Real-time streaming code review',
    'Multi-model consensus (Claude + GPT-4.1 + Gemini)',
    'Token cost transparency',
    'Team coaching dashboard',
    'AI reviewer brief',
    'Plain-English custom rules',
    'Path-filtered auto-review',
    'Historical pattern detection',
    'Reviewer assignment suggestions',
  ],
  screenshot: `${APP_URL}/opengraph-image`,
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 antialiased`}>
        {/* Nav */}
        <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  P
                </div>
                <span className="font-semibold text-zinc-100">{APP_NAME}</span>
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
                  <Link href="/coaching" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                    Coaching
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
              {APP_NAME} · Powered by{' '}
              <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500">
                Anthropic Claude
              </a>
              {' · '}
              <Link href="/settings/billing" className="hover:text-zinc-500">Pricing</Link>
              {' · '}
              <Link href="/settings/repos" className="hover:text-zinc-500">Repos</Link>
              {' · '}
              <Link href="/settings/rules" className="hover:text-zinc-500">Rules</Link>
              {' · '}
              Diffs are never stored
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
