import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/db'
import { UserMenu } from '@/components/UserMenu'
import { Providers } from '@/components/Providers'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getAppUrl } from '@/lib/app-url'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })

const APP_URL = getAppUrl()
const APP_NAME = 'Prova'
const APP_DESCRIPTION =
  'AI-powered code review that streams results file-by-file. Multi-model consensus from Claude, GPT-4.1, and Gemini. Team coaching, cost transparency, custom rules — no signup required.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — AI Code Review for Pull Requests`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'AI code review', 'pull request review', 'automated code review',
    'Claude code review', 'GPT-4 code review', 'multi-model code review',
    'GitHub PR review', 'code quality tool', 'security code review',
    'streaming code review', 'free code review tool',
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  openGraph: {
    type: 'website', locale: 'en_US', url: APP_URL, siteName: APP_NAME,
    title: `${APP_NAME} — AI Code Review, in seconds`,
    description: APP_DESCRIPTION,
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — AI Code Review, in seconds`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/opengraph-image`],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: APP_URL },
}

const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: APP_NAME,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: APP_DESCRIPTION,
  url: APP_URL,
  featureList: [
    'Real-time streaming code review',
    'Multi-model consensus (Claude + GPT-4.1 + Gemini)',
    'Token cost transparency',
    'Team coaching dashboard',
    'Plain-English custom rules',
    'GitHub PR URL integration',
    'Post reviews directly to GitHub',
  ],
  screenshot: `${APP_URL}/opengraph-image`,
}

const HOWTO_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to review a pull request with AI',
  description: 'Use Prova to get an AI-powered code review in under 10 seconds',
  step: [
    { '@type': 'HowToStep', name: 'Paste your diff', text: 'Run git diff and paste the output, or paste a GitHub PR URL directly.' },
    { '@type': 'HowToStep', name: 'Choose your models', text: 'Review with Claude only, or run 3-model consensus for higher confidence.' },
    { '@type': 'HowToStep', name: 'Get instant results', text: 'See per-file issues streamed in real time — bugs, security, performance, and more.' },
  ],
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does Prova work without signing in?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Paste any git diff and get a full review instantly — no account required.' },
    },
    {
      '@type': 'Question',
      name: 'How is Prova different from GitHub Copilot or CodeRabbit?',
      acceptedAnswer: { '@type': 'Answer', text: 'Prova streams results token-by-token, runs multi-model consensus across Claude, GPT-4.1, and Gemini simultaneously, shows exact LLM cost per review, and builds coaching insights from your team\'s patterns. None of these exist in Copilot or CodeRabbit.' },
    },
    {
      '@type': 'Question',
      name: 'How much does each review cost?',
      acceptedAnswer: { '@type': 'Answer', text: 'A typical 3-file PR costs under $0.02 with Claude only. Multi-model consensus runs under $0.06. You pay your actual API costs — no markup, no flat subscription.' },
    },
    {
      '@type': 'Question',
      name: 'Can it review private GitHub repositories?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Sign in with GitHub and paste the PR URL. Prova uses your OAuth token to fetch the diff. The token is never stored.' },
    },
    {
      '@type': 'Question',
      name: 'Is my code stored anywhere?',
      acceptedAnswer: { '@type': 'Answer', text: 'Diffs are never stored. Only review results (issues, summaries, verdicts) are saved, and only for signed-in users. Delete any review at any time.' },
    },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user ?? null
    if (user) profile = await getProfile(supabase, user.id)
  } catch { /* anonymous mode */ }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_SCHEMA) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_SCHEMA) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <Providers>

          {/* ── Nav ──────────────────────────────────────────────────────── */}
          <header className="sticky top-0 z-40 border-b border-[--border] bg-[--background]/90 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">

              <div className="flex items-center gap-7">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/30 transition-shadow group-hover:shadow-indigo-500/50">
                    P
                  </div>
                  <span className="font-semibold tracking-tight text-[--foreground]">{APP_NAME}</span>
                  <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400 border border-indigo-500/20">
                    beta
                  </span>
                </Link>

                {user && (
                  <nav className="hidden items-center gap-5 sm:flex">
                    {[
                      { href: '/dashboard', label: 'Dashboard' },
                      { href: '/reviews', label: 'History' },
                      { href: '/coaching', label: 'Coaching' },
                    ].map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="text-sm text-[--foreground] opacity-50 hover:opacity-100 transition-opacity"
                      >
                        {label}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!user && (
                  <Link
                    href="/pricing"
                    className="hidden sm:block text-sm opacity-50 hover:opacity-100 transition-opacity px-3 py-1.5"
                  >
                    Pricing
                  </Link>
                )}
                <ThemeToggle />
                {user && profile ? (
                  <UserMenu username={profile.username} avatarUrl={profile.avatar_url} plan={profile.plan} />
                ) : (
                  <Link
                    href="/login"
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 shadow-sm shadow-indigo-500/20"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main>{children}</main>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <footer className="mt-24 border-t border-[--border] py-8">
            <div className="mx-auto max-w-5xl px-5">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">P</div>
                  <span className="text-sm font-medium text-[--foreground] opacity-60">{APP_NAME}</span>
                </div>
                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs opacity-40">
                  {[
                    { href: '/pricing', label: 'Pricing' },
                    { href: '/settings/billing', label: 'Billing' },
                    { href: '/settings/repos', label: 'Repos' },
                    { href: '/settings/rules', label: 'Rules' },
                    { href: '/privacy', label: 'Privacy' },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} className="hover:opacity-100 transition-opacity">
                      {label}
                    </Link>
                  ))}
                  <span>·</span>
                  <span>Diffs are never stored</span>
                </nav>
              </div>
            </div>
          </footer>

        </Providers>
      </body>
    </html>
  )
}
