/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UserProfile, ReviewRow, ReviewFileRow, Plan } from './types'
import { PLAN_LIMITS } from './types'
import type { OverallSummary, FileReviewState } from '@/lib/types'

type DB = { from: (table: string) => any; rpc: (fn: string, args?: any) => any }

// ─── User Profiles ───────────────────────────────────────────────────────────

export async function getProfile(db: DB, userId: string): Promise<UserProfile | null> {
  const { data } = await db.from('user_profiles').select('*').eq('id', userId).single()
  return data as UserProfile | null
}

export async function getOrCreateProfile(
  db: DB,
  userId: string,
  defaults: Partial<UserProfile>,
): Promise<UserProfile | null> {
  const existing = await getProfile(db, userId)
  if (existing) return existing

  const { data } = await db
    .from('user_profiles')
    .insert({ id: userId, plan: 'free', usage_count: 0, ...defaults })
    .select()
    .single()

  return data as UserProfile | null
}

export async function updateProfile(
  db: DB,
  userId: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  await db
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
}

export async function checkUsageLimit(
  db: DB,
  userId: string,
): Promise<{ allowed: boolean; used: number; limit: number | null; resetAt: string }> {
  const profile = await getProfile(db, userId)

  if (!profile) {
    const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    return { allowed: true, used: 0, limit: PLAN_LIMITS.free, resetAt: nextReset.toISOString() }
  }

  const now = new Date()
  const resetAt = new Date(profile.usage_reset_at)

  if (now >= resetAt) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    await db
      .from('user_profiles')
      .update({ usage_count: 0, usage_reset_at: nextReset.toISOString() })
      .eq('id', userId)
    return { allowed: true, used: 0, limit: PLAN_LIMITS[profile.plan as Plan], resetAt: nextReset.toISOString() }
  }

  const limit = PLAN_LIMITS[profile.plan as Plan]
  const allowed = limit === null || profile.usage_count < limit

  return { allowed, used: profile.usage_count, limit, resetAt: profile.usage_reset_at }
}

export async function incrementUsage(db: DB, userId: string): Promise<void> {
  await db.rpc('increment_usage_count', { user_id: userId })
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function saveReview(
  db: DB,
  userId: string,
  files: FileReviewState[],
  summary: OverallSummary,
  meta: { prUrl?: string; prTitle?: string; repo?: string; prNumber?: number },
): Promise<string | null> {
  const { data: review, error } = await db
    .from('reviews')
    .insert({
      user_id: userId,
      pr_url: meta.prUrl ?? null,
      repo: meta.repo ?? null,
      pr_number: meta.prNumber ?? null,
      pr_title: meta.prTitle ?? null,
      overall_summary: summary.summary,
      verdict: summary.verdict,
      total_issues: summary.total_issues,
      critical_count: summary.critical_count,
      warning_count: summary.warning_count,
      suggestion_count: summary.suggestion_count,
      info_count: summary.info_count,
      files_reviewed: summary.files_reviewed,
      files_skipped: summary.files_skipped,
      model_used: 'claude-sonnet-4-6',
      status: 'complete',
      is_public: false,
    })
    .select('id')
    .single()

  if (error || !review) return null

  const reviewId = (review as { id: string }).id

  const fileInserts = files
    .filter((f) => f.status === 'complete' && f.result)
    .map((f) => ({
      review_id: reviewId,
      file_path: f.file,
      language: null,
      file_summary: f.result!.file_summary,
      issues: f.result!.issues,
      verdict: f.result!.verdict,
      issue_count: f.result!.issues.length,
    }))

  if (fileInserts.length > 0) {
    await db.from('review_files').insert(fileInserts)
  }

  return reviewId
}

export async function getReview(
  db: DB,
  reviewId: string,
  userId?: string,
): Promise<(ReviewRow & { files: ReviewFileRow[] }) | null> {
  let query = db.from('reviews').select('*').eq('id', reviewId)
  if (userId) query = query.eq('user_id', userId)
  else query = query.eq('is_public', true)

  const { data: review } = await query.single()
  if (!review) return null

  const { data: files } = await db
    .from('review_files')
    .select('*')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true })

  return { ...(review as ReviewRow), files: (files as ReviewFileRow[]) ?? [] }
}

export async function listReviews(
  db: DB,
  userId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<ReviewRow[]> {
  const { limit = 20, offset = 0 } = options
  const { data } = await db
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as ReviewRow[]) ?? []
}

export async function deleteReview(db: DB, reviewId: string, userId: string): Promise<void> {
  await db.from('reviews').delete().eq('id', reviewId).eq('user_id', userId)
}

// ─── Cost Tracking ───────────────────────────────────────────────────────────

export interface CostRecord {
  review_id: string
  user_id: string
  model: string
  file_path?: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
}

export async function saveCost(db: DB, record: CostRecord): Promise<void> {
  await db.from('review_costs').insert(record)
}

export async function saveCosts(db: DB, records: CostRecord[]): Promise<void> {
  if (records.length === 0) return
  await db.from('review_costs').insert(records)
}

export async function getMonthlyCost(
  db: DB,
  userId: string,
): Promise<{ totalUsd: number; reviewCount: number }> {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data } = await db
    .from('review_costs')
    .select('cost_usd, review_id')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)

  const rows = (data as { cost_usd: number; review_id: string }[]) ?? []
  const totalUsd = rows.reduce((sum, r) => sum + Number(r.cost_usd), 0)
  const reviewCount = new Set(rows.map((r) => r.review_id)).size

  return { totalUsd, reviewCount }
}

// ─── Team Rules ──────────────────────────────────────────────────────────────

export interface TeamRule {
  id?: string
  user_id: string
  repo_pattern: string
  rule_text: string
  enabled: boolean
}

export async function getUserRules(
  db: DB,
  userId: string,
  repoPattern?: string,
): Promise<TeamRule[]> {
  let query = db
    .from('team_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('created_at', { ascending: true })

  const { data } = await query
  const rules = (data as TeamRule[]) ?? []

  if (!repoPattern) return rules
  return rules.filter(
    (r) => r.repo_pattern === '*' || r.repo_pattern === repoPattern,
  )
}

export async function createRule(db: DB, rule: Omit<TeamRule, 'id'>): Promise<TeamRule | null> {
  const { data } = await db
    .from('team_rules')
    .insert(rule)
    .select()
    .single()
  return data as TeamRule | null
}

export async function updateRule(
  db: DB,
  ruleId: string,
  userId: string,
  updates: Partial<Pick<TeamRule, 'rule_text' | 'repo_pattern' | 'enabled'>>,
): Promise<void> {
  await db
    .from('team_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('user_id', userId)
}

export async function deleteRule(db: DB, ruleId: string, userId: string): Promise<void> {
  await db.from('team_rules').delete().eq('id', ruleId).eq('user_id', userId)
}

// ─── Repo Settings ───────────────────────────────────────────────────────────

export interface RepoSettings {
  id?: string
  user_id: string
  repo_name: string
  path_includes: string[]
  path_excludes: string[]
  auto_review_enabled: boolean
  models: string[]
  webhook_secret?: string | null
}

export async function getRepoSettings(
  db: DB,
  userId: string,
  repoName: string,
): Promise<RepoSettings | null> {
  const { data } = await db
    .from('repo_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('repo_name', repoName)
    .single()
  return (data as RepoSettings) ?? null
}

export async function listRepoSettings(db: DB, userId: string): Promise<RepoSettings[]> {
  const { data } = await db
    .from('repo_settings')
    .select('*')
    .eq('user_id', userId)
    .order('repo_name', { ascending: true })
  return (data as RepoSettings[]) ?? []
}

export async function upsertRepoSettings(
  db: DB,
  settings: Omit<RepoSettings, 'id'>,
): Promise<RepoSettings | null> {
  const { data } = await db
    .from('repo_settings')
    .upsert(
      { ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,repo_name' },
    )
    .select()
    .single()
  return (data as RepoSettings) ?? null
}

// ─── Issue Embeddings ─────────────────────────────────────────────────────────

export async function saveIssueEmbeddings(
  db: DB,
  embeddings: Array<{
    review_id: string
    user_id: string
    file_path: string
    issue_title: string
    issue_text: string
    severity?: string
    category?: string
    embedding: number[]
  }>,
): Promise<void> {
  if (embeddings.length === 0) return
  await db.from('issue_embeddings').insert(embeddings)
}

export async function findSimilarIssues(
  db: DB,
  userId: string,
  queryEmbedding: number[],
  threshold = 0.85,
  limit = 5,
) {
  const { data } = await db.rpc('find_similar_issues', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_threshold: threshold,
    match_count: limit,
  })
  return data ?? []
}

// ─── Plan management ─────────────────────────────────────────────────────────

export async function upgradePlan(
  db: DB,
  userId: string,
  plan: Plan,
  stripeData?: { customerId?: string; subscriptionId?: string },
): Promise<void> {
  await db
    .from('user_profiles')
    .update({
      plan,
      stripe_customer_id: stripeData?.customerId ?? null,
      stripe_subscription_id: stripeData?.subscriptionId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}
