'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { GitHubIcon } from '@/components/GitHubIcon'

export function LoginButton({ redirectTo }: { redirectTo: string }) {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user user:email repo',
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GitHubIcon className="size-4" />
      )}
      {loading ? 'Redirecting to GitHub…' : 'Continue with GitHub'}
    </button>
  )
}
