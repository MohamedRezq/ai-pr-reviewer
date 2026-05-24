export type Plan = 'free' | 'pro' | 'team'
export type ReviewVerdict = 'approved' | 'needs_changes' | 'nitpick'
export type ReviewStatus = 'pending' | 'complete' | 'error'

export interface UserProfile {
  id: string
  github_id: number | null
  email: string | null
  username: string | null
  avatar_url: string | null
  name: string | null
  plan: Plan
  usage_count: number
  usage_reset_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface ReviewRow {
  id: string
  user_id: string | null
  pr_url: string | null
  repo: string | null
  pr_number: number | null
  pr_title: string | null
  overall_summary: string | null
  verdict: ReviewVerdict | null
  total_issues: number
  critical_count: number
  warning_count: number
  suggestion_count: number
  info_count: number
  files_reviewed: number
  files_skipped: number
  model_used: string | null
  status: ReviewStatus
  is_public: boolean
  created_at: string
}

export interface ReviewFileRow {
  id: string
  review_id: string
  file_path: string
  language: string | null
  file_summary: string | null
  issues: unknown
  verdict: ReviewVerdict | null
  issue_count: number
  created_at: string
}

// Lightweight type for Database generic — can be replaced with generated types via `supabase gen types`
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Partial<UserProfile> & { id: string }
        Update: Partial<UserProfile>
      }
      reviews: {
        Row: ReviewRow
        Insert: Omit<ReviewRow, 'id' | 'created_at'>
        Update: Partial<ReviewRow>
      }
      review_files: {
        Row: ReviewFileRow
        Insert: Omit<ReviewFileRow, 'id' | 'created_at'>
        Update: Partial<ReviewFileRow>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export const FREE_REVIEW_LIMIT = 5
export const PRO_REVIEW_LIMIT = null // unlimited
export const PLAN_LIMITS: Record<Plan, number | null> = {
  free: FREE_REVIEW_LIMIT,
  pro: null,
  team: null,
}
