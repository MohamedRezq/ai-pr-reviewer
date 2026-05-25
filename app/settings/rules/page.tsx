'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface TeamRule {
  id: string
  rule_text: string
  repo_pattern: string
  enabled: boolean
  created_at: string
}

export default function RulesPage() {
  const [rules, setRules] = useState<TeamRule[]>([])
  const [loading, setLoading] = useState(true)
  const [newRuleText, setNewRuleText] = useState('')
  const [newRepoPattern, setNewRepoPattern] = useState('*')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rules')
      if (!res.ok) throw new Error('Failed to load rules')
      const { rules: data } = await res.json()
      setRules(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  async function addRule() {
    if (!newRuleText.trim()) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_text: newRuleText.trim(), repo_pattern: newRepoPattern }),
      })
      if (!res.ok) {
        const { error: e } = await res.json()
        throw new Error(e ?? 'Failed')
      }
      setNewRuleText('')
      setNewRepoPattern('*')
      await loadRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAdding(false)
    }
  }

  async function toggleRule(rule: TeamRule) {
    try {
      await fetch('/api/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
      })
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)))
    } catch { /* ignore */ }
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    try {
      await fetch('/api/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rule_text: editText.trim() }),
      })
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, rule_text: editText.trim() } : r)))
      setEditingId(null)
    } catch { /* ignore */ }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return
    try {
      await fetch(`/api/rules?id=${id}`, { method: 'DELETE' })
      setRules((prev) => prev.filter((r) => r.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
          <span>/</span>
          <span className="text-zinc-300">Custom Rules</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Custom Review Rules</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Write plain-English rules that get injected into every review. No YAML, no templates.
        </p>
      </div>

      {/* Add rule form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">Add a rule</h2>
        <div className="flex flex-col gap-3">
          <textarea
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            placeholder="e.g. Always add error boundaries around async operations. Never use console.log in production code. All database queries must use parameterized statements."
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-600 focus:outline-none resize-none"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">Repo pattern (optional)</label>
              <input
                type="text"
                value={newRepoPattern}
                onChange={(e) => setNewRepoPattern(e.target.value)}
                placeholder="* or owner/repo"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <button
              onClick={addRule}
              disabled={adding || !newRuleText.trim()}
              className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add Rule
            </button>
          </div>
          <p className="text-xs text-zinc-600">{newRuleText.length}/500 characters</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-zinc-600" />
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
          <p className="text-zinc-500">No custom rules yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Add rules above — they&apos;ll apply to every future review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-xl border px-4 py-4 transition-all ${rule.enabled ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-900 bg-zinc-950/50 opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <button onClick={() => toggleRule(rule)} className="mt-0.5 shrink-0 text-zinc-500 hover:text-zinc-300">
                  {rule.enabled ? (
                    <ToggleRight className="size-5 text-indigo-400" />
                  ) : (
                    <ToggleLeft className="size-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === rule.id ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-600 focus:outline-none resize-none"
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => saveEdit(rule.id)}
                          className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-1.5 text-emerald-400 hover:border-emerald-700"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-300 leading-relaxed">{rule.rule_text}</p>
                  )}
                  {rule.repo_pattern !== '*' && (
                    <span className="mt-1 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      {rule.repo_pattern}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => { setEditingId(rule.id); setEditText(rule.rule_text) }}
                    className="rounded-lg border border-transparent p-1.5 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="rounded-lg border border-transparent p-1.5 text-zinc-600 hover:border-red-900/50 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-600">
        Active rules are included as context in every AI review. Keep them specific and actionable.
      </p>
    </div>
  )
}
