export type IssueSeverity = 'critical' | 'warning' | 'suggestion' | 'info'
export type IssueCategory = 'bug' | 'security' | 'performance' | 'maintainability' | 'style'
export type ReviewVerdict = 'approved' | 'needs_changes' | 'nitpick'
export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed'
export type ModelId = 'claude-3-5-sonnet-20241022' | 'gpt-4.1' | 'gemini-2.0-flash'

export interface Issue {
  line?: number
  end_line?: number
  severity: IssueSeverity
  category: IssueCategory
  title: string
  description: string
}

export interface FileReviewResult {
  file_summary: string
  issues: Issue[]
  verdict: ReviewVerdict
  model?: ModelId
  usage?: { input_tokens: number; output_tokens: number; cost_usd: number }
}

export interface DiffFile {
  path: string
  oldPath: string
  changeType: FileChangeType
  patch: string
  additions: number
  deletions: number
}

export interface OverallSummary {
  summary: string
  verdict: ReviewVerdict
  total_issues: number
  critical_count: number
  warning_count: number
  suggestion_count: number
  info_count: number
  files_reviewed: number
  files_skipped: number
  models_used?: ModelId[]
  total_cost_usd?: number
}

export interface FileReviewState {
  file: string
  status: 'pending' | 'reviewing' | 'complete' | 'error'
  result?: FileReviewResult
  error?: string
  streamingText?: string
  consensus?: ConsensusResult
  similarIssues?: SimilarIssue[]
  reviewerSuggestion?: ReviewerSuggestion
}

// ─── Multi-model consensus ──────────────────────────────────────────────────

export interface ModelResult {
  model: ModelId
  result: FileReviewResult
}

export interface ConsensusIssue extends Issue {
  agreedBy: ModelId[]
  disagreedBy: ModelId[]
  confidence: 'high' | 'medium' | 'low'
}

export interface ConsensusResult {
  issues: ConsensusIssue[]
  verdict: ReviewVerdict
  file_summary: string
  agreementScore: number
}

// ─── Historical similarity ──────────────────────────────────────────────────

export interface SimilarIssue {
  issueTitle: string
  filePath: string
  reviewId: string
  similarity: number
  createdAt: string
}

// ─── Reviewer assignment ───────────────────────────────────────────────────

export interface ReviewerSuggestion {
  suggestedReviewer: string
  ownershipPct: number
  recentCommits: number
}

// ─── SSE event union ────────────────────────────────────────────────────────

export type SSEEvent =
  | { type: 'review_start'; total: number; files: string[]; models: ModelId[] }
  | { type: 'file_start'; file: string }
  | { type: 'token_chunk'; file: string; chunk: string; model: ModelId }
  | { type: 'file_complete'; file: string; result: FileReviewResult; consensus?: ConsensusResult }
  | { type: 'file_error'; file: string; error: string }
  | { type: 'similar_issues'; file: string; issues: SimilarIssue[] }
  | { type: 'reviewer_suggestion'; file: string; suggestion: ReviewerSuggestion }
  | { type: 'reviewer_brief'; brief: string }
  | { type: 'review_complete'; summary: OverallSummary; reviewId?: string }
  | { type: 'error'; message: string }
