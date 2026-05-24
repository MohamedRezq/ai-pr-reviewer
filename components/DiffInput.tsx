'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ClipboardPaste, X, GitBranch, ArrowRight, Loader2, Lock, Link as LinkIcon } from 'lucide-react'

interface DiffInputProps {
  onSubmit: (diff: string, prUrl?: string) => void
  isLoading: boolean
  isLoggedIn?: boolean
  initialPrUrl?: string
}

const EXAMPLE_DIFF = `diff --git a/src/auth/login.ts b/src/auth/login.ts
index a1b2c3d..e4f5g6h 100644
--- a/src/auth/login.ts
+++ b/src/auth/login.ts
@@ -12,8 +12,10 @@ export async function loginUser(email: string, password: string) {
   const user = await db.users.findOne({ email })
-  if (!user) throw new Error('User not found')
-  const match = await bcrypt.compare(password, user.passwordHash)
-  if (!match) throw new Error('Invalid password')
+  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
+    throw new Error('User not found')
+  }
+
+  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
   return { user, token }`

type InputMode = 'diff' | 'pr_url'

export function DiffInput({ onSubmit, isLoading, isLoggedIn = false, initialPrUrl }: DiffInputProps) {
  const [mode, setMode] = useState<InputMode>(initialPrUrl ? 'pr_url' : 'diff')
  const [diffValue, setDiffValue] = useState('')
  const [prUrlValue, setPrUrlValue] = useState(initialPrUrl ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isValidPrUrl = /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(prUrlValue)
  const hasDiff = diffValue.trim().length > 0
  const lineCount = diffValue ? diffValue.split('\n').length : 0
  const looksLikeDiff = hasDiff && (diffValue.includes('diff --git') || diffValue.includes('@@'))

  const canSubmit = mode === 'pr_url' ? isValidPrUrl : hasDiff

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (mode === 'diff') setDiffValue(text)
      else setPrUrlValue(text)
    } catch { /* ignore */ }
  }

  const handleSubmit = () => {
    if (!canSubmit || isLoading) return
    if (mode === 'pr_url') {
      onSubmit('', prUrlValue.trim())
    } else {
      onSubmit(diffValue.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
        <button
          onClick={() => setMode('diff')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'diff'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300',
          )}
        >
          Paste Diff
        </button>
        <button
          onClick={() => setMode('pr_url')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'pr_url'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300',
            !isLoggedIn && 'opacity-50',
          )}
          title={!isLoggedIn ? 'Sign in to review by PR URL' : undefined}
        >
          <LinkIcon className="size-3.5" />
          PR URL
          {!isLoggedIn && (
            <span className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-600">Pro</span>
          )}
        </button>
      </div>

      {/* Input area */}
      {mode === 'diff' ? (
        <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition-colors focus-within:border-zinc-600">
          <textarea
            ref={textareaRef}
            value={diffValue}
            onChange={(e) => setDiffValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Paste your git diff here…\n\nExample:\n${EXAMPLE_DIFF}`}
            className="min-h-[300px] w-full resize-none bg-transparent p-4 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
            <span className="text-xs text-zinc-600">
              {hasDiff ? (
                <>
                  {lineCount.toLocaleString()} lines
                  {looksLikeDiff
                    ? <span className="ml-2 text-emerald-500">✓ Diff detected</span>
                    : <span className="ml-2 text-amber-500">⚠ Doesn&apos;t look like a diff</span>}
                </>
              ) : (
                <>Paste output of <code className="rounded bg-zinc-800 px-1 text-zinc-400">git diff</code></>
              )}
            </span>
            <div className="flex items-center gap-2">
              {hasDiff && (
                <button onClick={() => setDiffValue('')} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
                  <X className="size-3" /> Clear
                </button>
              )}
              <button onClick={handlePaste} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
                <ClipboardPaste className="size-3" /> Paste
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(!isLoggedIn && 'pointer-events-none opacity-50')}>
          {!isLoggedIn ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
              <p className="text-sm font-medium text-zinc-300">Sign in to review PRs by URL</p>
              <p className="mt-1 text-xs text-zinc-500">
                Connect your GitHub account to fetch PR diffs automatically.
              </p>
              <a
                href="/login"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                Sign in with GitHub
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition-colors focus-within:border-zinc-600">
              <input
                type="url"
                value={prUrlValue}
                onChange={(e) => setPrUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full bg-transparent px-4 py-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
              />
              <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-600">
                {isValidPrUrl
                  ? <span className="text-emerald-500">✓ Valid GitHub PR URL</span>
                  : prUrlValue
                    ? <span className="text-amber-500">⚠ Enter a valid github.com PR URL</span>
                    : 'Paste a GitHub pull request URL'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1"><GitBranch className="size-3" />Up to 50 files</span>
          <span className="hidden items-center gap-1 sm:flex"><Lock className="size-3" />Never stored</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className={cn(
            'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all',
            canSubmit && !isLoading
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]'
              : 'cursor-not-allowed bg-zinc-800 text-zinc-500',
          )}
        >
          {isLoading ? <><Loader2 className="size-4 animate-spin" />Reviewing…</> : <>Review Code<ArrowRight className="size-4" /></>}
        </button>
      </div>
    </div>
  )
}
