'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Settings, Webhook, Loader2, Check } from 'lucide-react'
import Link from 'next/link'

interface RepoSettings {
  id: string
  repo_name: string
  path_includes: string[]
  path_excludes: string[]
  auto_review_enabled: boolean
  models: string[]
  webhook_secret?: string | null
}

const MODEL_LABELS: Record<string, string> = {
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'gpt-4.1': 'GPT-4.1',
  'gemini-2.0-flash': 'Gemini 2.0',
}

const ALL_MODELS = ['claude-sonnet-4-6', 'gpt-4.1', 'gemini-2.0-flash']

export default function ReposPage() {
  const [repos, setRepos] = useState<RepoSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    repo_name: '',
    path_includes: '',
    path_excludes: '',
    auto_review_enabled: false,
    models: ['claude-sonnet-4-6'],
    webhook_secret: '',
  })

  const loadRepos = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/repos')
    if (res.ok) {
      const { repos: data } = await res.json()
      setRepos(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadRepos() }, [loadRepos])

  async function saveRepo() {
    if (!form.repo_name.trim()) return
    setSaving(true)
    try {
      await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: form.repo_name.trim(),
          path_includes: form.path_includes.split(',').map((s) => s.trim()).filter(Boolean),
          path_excludes: form.path_excludes.split(',').map((s) => s.trim()).filter(Boolean),
          auto_review_enabled: form.auto_review_enabled,
          models: form.models,
          webhook_secret: form.webhook_secret || null,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setShowForm(false)
      setForm({ repo_name: '', path_includes: '', path_excludes: '', auto_review_enabled: false, models: ['claude-sonnet-4-6'], webhook_secret: '' })
      await loadRepos()
    } finally {
      setSaving(false)
    }
  }

  function toggleModel(model: string) {
    setForm((prev) => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.length > 1 ? prev.models.filter((m) => m !== model) : prev.models
        : [...prev.models, model],
    }))
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/github`
    : '/api/webhooks/github'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
          <span>/</span>
          <span className="text-zinc-300">Repo Settings</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Repository Settings</h1>
            <p className="mt-1 text-sm text-zinc-500">Per-repo path filters, auto-review, and model selection.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus className="size-4" />
            Add Repo
          </button>
        </div>
      </div>

      {/* Webhook URL info */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Webhook className="size-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">GitHub Webhook URL</span>
        </div>
        <p className="text-xs text-zinc-500 mb-2">
          Add this URL to your GitHub repo (Settings → Webhooks). Select &quot;Pull requests&quot; events.
        </p>
        <code className="block rounded-lg bg-zinc-800/60 px-3 py-2 text-xs text-indigo-300 break-all">
          {webhookUrl}
        </code>
      </div>

      {/* Add repo form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Configure repository</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Repository name *</label>
              <input
                type="text"
                value={form.repo_name}
                onChange={(e) => setForm((p) => ({ ...p, repo_name: e.target.value }))}
                placeholder="owner/repo"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Only review files matching (comma-separated globs)</label>
                <input
                  type="text"
                  value={form.path_includes}
                  onChange={(e) => setForm((p) => ({ ...p, path_includes: e.target.value }))}
                  placeholder="src/**,lib/**"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Skip files matching (comma-separated globs)</label>
                <input
                  type="text"
                  value={form.path_excludes}
                  onChange={(e) => setForm((p) => ({ ...p, path_excludes: e.target.value }))}
                  placeholder="**/*.test.ts,docs/**"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2">Models</label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleModel(m)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      form.models.includes(m)
                        ? 'border-indigo-900/50 bg-indigo-950 text-indigo-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {MODEL_LABELS[m] ?? m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.auto_review_enabled}
                  onChange={(e) => setForm((p) => ({ ...p, auto_review_enabled: e.target.checked }))}
                  className="size-4 rounded border-zinc-600 bg-zinc-800 accent-indigo-600"
                />
                <span className="text-sm text-zinc-300">Auto-review on PR open/sync</span>
              </label>
            </div>

            {form.auto_review_enabled && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Per-repo webhook secret (optional)</label>
                <input
                  type="password"
                  value={form.webhook_secret}
                  onChange={(e) => setForm((p) => ({ ...p, webhook_secret: e.target.value }))}
                  placeholder="Your GitHub webhook secret"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={saveRepo}
                disabled={saving || !form.repo_name.trim()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : <Settings className="size-4" />}
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repos list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-zinc-600" /></div>
      ) : repos.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
          <p className="text-zinc-500">No repos configured yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Without settings, all files are reviewed with Claude by default.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {repos.map((repo) => (
            <div key={repo.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-200">{repo.repo_name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {repo.models.map((m) => (
                      <span key={m} className="rounded-full bg-indigo-950 px-2 py-0.5 text-xs text-indigo-400">
                        {MODEL_LABELS[m] ?? m}
                      </span>
                    ))}
                    {repo.auto_review_enabled && (
                      <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs text-emerald-400">
                        Auto-review on
                      </span>
                    )}
                    {repo.path_includes.length > 0 && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        includes: {repo.path_includes.join(', ')}
                      </span>
                    )}
                    {repo.path_excludes.length > 0 && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        excludes: {repo.path_excludes.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
