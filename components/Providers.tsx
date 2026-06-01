'use client'

import { ThemeProvider } from 'next-themes'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    // Lazy-init PostHog on first page view
    import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: false,
          disable_session_recording: false,
          session_recording: {
            // Never record diff textarea content
            maskAllInputs: false,
            maskInputFn: (text, element) => {
              if (element?.tagName === 'TEXTAREA') return '***'
              return text
            },
          },
          before_send: (event) => {
            // Strip any diff content from properties
            if (event?.properties?.diff) delete event.properties.diff
            return event
          },
        })
        // Expose to window for analytics.ts helper
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).posthog = posthog
      }

      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      posthog.capture('$pageview', { $current_url: url })
    }).catch(() => { /* PostHog optional */ })
  }, [pathname, searchParams])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </ThemeProvider>
  )
}
