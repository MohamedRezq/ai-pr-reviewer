export type IssueSeverity = 'critical' | 'warning' | 'suggestion' | 'info'
export type IssueCategory = 'bug' | 'security' | 'performance' | 'maintainability' | 'style'
export type ReviewVerdict = 'approved' | 'needs_changes' | 'nitpick'
export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed'

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
}

export interface FileReviewState {
  file: string
  status: 'pending' | 'reviewing' | 'complete' | 'error'
  result?: FileReviewResult
  error?: string
}

export type SSEEvent =
  | { type: 'review_start'; total: number; files: string[] }
  | { type: 'file_complete'; file: string; result: FileReviewResult }
  | { type: 'file_error'; file: string; error: string }
  | { type: 'review_complete'; summary: OverallSummary }
  | { type: 'error'; message: string }
