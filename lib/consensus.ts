import type {
  FileReviewResult,
  ConsensusResult,
  ConsensusIssue,
  ModelId,
  ReviewVerdict,
} from './types'

/**
 * Merges N model results into a consensus.
 * Issues agreed upon by 2+ models get "high" confidence.
 * Issues from only 1 model get "low" confidence.
 * Agreement score = ratio of issues seen by majority of models.
 */
export function buildConsensus(results: FileReviewResult[]): ConsensusResult {
  if (results.length === 0) {
    return {
      issues: [],
      verdict: 'approved',
      file_summary: 'No results',
      agreementScore: 0,
    }
  }

  if (results.length === 1) {
    return {
      issues: results[0].issues.map((issue) => ({
        ...issue,
        agreedBy: [results[0].model ?? ('claude-sonnet-4-6' as ModelId)],
        disagreedBy: [],
        confidence: 'medium',
      })),
      verdict: results[0].verdict,
      file_summary: results[0].file_summary,
      agreementScore: 1,
    }
  }

  const modelCount = results.length
  // Group issues by normalized title for deduplication
  const issueMap = new Map<string, ConsensusIssue>()

  for (const result of results) {
    const modelId = result.model ?? ('claude-sonnet-4-6' as ModelId)
    for (const issue of result.issues) {
      const key = normalizeTitle(issue.title)
      const existing = issueMap.get(key)
      if (existing) {
        if (!existing.agreedBy.includes(modelId)) {
          existing.agreedBy.push(modelId)
        }
      } else {
        issueMap.set(key, {
          ...issue,
          agreedBy: [modelId],
          disagreedBy: [],
          confidence: 'low',
        })
      }
    }
  }

  // Mark confidence and which models disagreed
  const allModelIds = results.map((r) => r.model ?? ('claude-sonnet-4-6' as ModelId))

  const consensusIssues: ConsensusIssue[] = []
  for (const issue of issueMap.values()) {
    issue.disagreedBy = allModelIds.filter((m) => !issue.agreedBy.includes(m))
    const agreedCount = issue.agreedBy.length
    issue.confidence =
      agreedCount >= modelCount ? 'high' : agreedCount >= Math.ceil(modelCount / 2) ? 'medium' : 'low'
    consensusIssues.push(issue)
  }

  // Sort: high confidence first, then by severity
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, suggestion: 2, info: 3 }
  const confidenceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  consensusIssues.sort((a, b) => {
    const cd = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
    if (cd !== 0) return cd
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  })

  // Compute agreement score
  const highAndMedium = consensusIssues.filter(
    (i) => i.confidence === 'high' || i.confidence === 'medium',
  ).length
  const agreementScore =
    consensusIssues.length > 0 ? highAndMedium / consensusIssues.length : 1

  // Combine verdicts — use strictest majority verdict
  const verdictCounts: Record<ReviewVerdict, number> = {
    needs_changes: 0,
    nitpick: 0,
    approved: 0,
  }
  for (const r of results) verdictCounts[r.verdict]++
  const verdict: ReviewVerdict =
    verdictCounts.needs_changes >= Math.ceil(modelCount / 2)
      ? 'needs_changes'
      : verdictCounts.nitpick >= Math.ceil(modelCount / 2)
        ? 'nitpick'
        : 'approved'

  // Pick the longest file_summary (usually Claude's)
  const file_summary =
    results.reduce((best, r) => (r.file_summary.length > best.length ? r.file_summary : best), '')

  return { issues: consensusIssues, verdict, file_summary, agreementScore }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}
