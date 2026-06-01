'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { analytics } from '@/lib/analytics'
import { ClipboardPaste, X, GitBranch, ArrowRight, Lock, Link as LinkIcon, Sparkles } from 'lucide-react'

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
@@ -8,12 +8,18 @@ import { db } from '../db'
+import jwt from 'jsonwebtoken'

 export async function loginUser(email: string, password: string) {
-  const user = await db.query(\`SELECT * FROM users WHERE email = '\${email}'\`)
-  if (!user) throw new Error('User not found')
-  const match = await bcrypt.compare(password, user.passwordHash)
-  if (!match) throw new Error('Invalid password')
-  return { user }
+  const user = await db.users.findOne({ email })
+  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
+    throw new Error('User not found')
+  }
+
+  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
+  const session = await db.sessions.create({ userId: user.id, token })
+  return { user, token, session }
 }
diff --git a/src/api/users.ts b/src/api/users.ts
index c3d4e5f..f6g7h8i 100644
--- a/src/api/users.ts
+++ b/src/api/users.ts
@@ -15,7 +15,11 @@ export async function getUser(req: Request, res: Response) {
-  const { id } = req.params
-  const user = await db.users.findOne({ id })
-  res.json(user)
+  const { id } = req.params
+  const user = await db.users.findOne({ id })
+  if (!user) {
+    return res.status(404).json({ error: 'User not found' })
+  }
+  res.json({ id: user.id, email: user.email, createdAt: user.createdAt })
 }`

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

  const handleLoadExample = () => {
    setMode('diff')
    setDiffValue(EXAMPLE_DIFF)
    analytics.exampleDiffLoaded()
    textareaRef.current?.focus()
  }

  const handleSubmit = () => {
    if (!canSubmit || isLoading) return
    if (mode === 'pr_url') {
      analytics.reviewStarted({ entry: 'pr_url', models: [], isLoggedIn })
      onSubmit('', prUrlValue.trim())
    } else {
      const entry = diffValue === EXAMPLE_DIFF ? 'example' : 'paste_diff'
      analytics.reviewStarted({ entry, models: [], isLoggedIn })
      onSubmit(diffValue.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl border border-[--border] bg-[--background]/60 p-1">
        <button
          onClick={() => setMode('diff')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mode === 'diff'
              ? 'bg-[--surface] text-[--foreground] shadow-sm'
              : 'text-[--foreground] opacity-40 hover:opacity-70',
          )}
        >
          Paste Diff
        </button>
        <button
          onClick={() => setMode('pr_url')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mode === 'pr_url'
              ? 'bg-[--surface] text-[--foreground] shadow-sm'
              : 'text-[--foreground] opacity-40 hover:opacity-70',
            !isLoggedIn && 'cursor-default',
          )}
        >
          <LinkIcon className="size-3.5" />
          PR URL
          {!isLoggedIn && (
            <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
              Sign in
            </span>
          )}
        </button>
      </div>

      {/* Input area */}
      {mode === 'diff' ? (
        <div className="group relative overflow-hidden rounded-xl border border-[--border] bg-[--background] transition-colors focus-within:border-indigo-500/50">
          <textarea
            ref={textareaRef}
            value={diffValue}
            onChange={(e) => setDiffValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Paste the output of git diff here…\n\nOr click "Try example" below to see how it works.`}
            className="min-h-[220px] w-full resize-none bg-transparent p-4 font-mono text-sm text-[--foreground] placeholder:text-[--foreground]/25 focus:outline-none"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between border-t border-[--border] px-4 py-2.5">
            <span className="text-xs text-[--foreground] opacity-35">
              {hasDiff ? (
                <>
                  {lineCount.toLocaleString()} lines
                  {looksLikeDiff
                    ? <span className="ml-2 text-emerald-400">✓ Diff detected</span>
                    : <span className="ml-2 text-amber-400">⚠ Doesn&apos;t look like a diff</span>}
                </>
              ) : (
                <span>
                  Output of <code className="rounded bg-[--surface] px-1.5 py-0.5 text-[--foreground] opacity-60">git diff</code> or <code className="rounded bg-[--surface] px-1.5 py-0.5 text-[--foreground] opacity-60">git diff HEAD~1</code>
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {!hasDiff && (
                <button
                  onClick={handleLoadExample}
                  className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/8 px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/15"
                >
                  <Sparkles className="size-3" />
                  Try example
                </button>
              )}
              {hasDiff && (
                <button
                  onClick={() => setDiffValue('')}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[--foreground] opacity-40 hover:opacity-80 transition-opacity"
                >
                  <X className="size-3" /> Clear
                </button>
              )}
              <button
                onClick={handlePaste}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[--foreground] opacity-40 hover:opacity-80 transition-opacity"
              >
                <ClipboardPaste className="size-3" /> Paste
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {!isLoggedIn ? (
            <div className="rounded-xl border border-[--border] bg-[--background]/60 p-6 text-center">
              <p className="text-sm font-medium text-[--foreground]">Sign in to review PRs by URL</p>
              <p className="mt-1 text-xs text-[--foreground] opacity-45">
                Connect your GitHub account to fetch PR diffs automatically.
              </p>
              <a
                href="/login"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-500/20"
                onClick={() => analytics.signupWallShown('pr_url')}
              >
                Sign in with GitHub
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[--border] bg-[--background] transition-colors focus-within:border-indigo-500/50">
              <input
                type="url"
                value={prUrlValue}
                onChange={(e) => setPrUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full bg-transparent px-4 py-4 text-sm text-[--foreground] placeholder:text-[--foreground]/25 focus:outline-none"
              />
              <div className="border-t border-[--border] px-4 py-2.5 text-xs text-[--foreground] opacity-40">
                {isValidPrUrl
                  ? <span className="text-emerald-400 opacity-100">✓ Valid GitHub PR URL</span>
                  : prUrlValue
                    ? <span className="text-amber-400 opacity-100">⚠ Enter a valid github.com PR URL</span>
                    : 'Paste a GitHub pull request URL'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-[--foreground] opacity-30">
          <span className="flex items-center gap-1.5"><GitBranch className="size-3" />Up to 50 files</span>
          <span className="hidden items-center gap-1.5 sm:flex"><Lock className="size-3" />Never stored</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className={cn(
            'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
            canSubmit && !isLoading
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/25 active:scale-[0.97]'
              : 'cursor-not-allowed bg-[--surface] text-[--foreground] opacity-25',
          )}
        >
          {isLoading
            ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Reviewing…</>
            : <>Review Code<ArrowRight className="size-4" /></>}
        </button>
      </div>
    </div>
  )
}
