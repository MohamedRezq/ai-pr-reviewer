/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TopIssuePattern {
  title: string
  category: string
  severity: string
  count: number
}

export interface CoachingData {
  topIssues: TopIssuePattern[]
  totalReviews: number
  totalIssues: number
  improvementScore: number | null
  periodStart: string
  periodEnd: string
}

/**
 * Aggregates review_files.issues JSONB for a user over a rolling 30-day window
 * and returns top issue patterns with frequency counts.
 */
export async function computeCoachingInsights(
  db: any,
  userId: string,
): Promise<CoachingData> {
  const periodEnd = new Date()
  const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data: files, error } = await db
    .from('review_files')
    .select('issues, review_id, reviews!inner(user_id, created_at)')
    .eq('reviews.user_id', userId)
    .gte('reviews.created_at', periodStart.toISOString())
    .lte('reviews.created_at', periodEnd.toISOString())

  if (error || !files) {
    return {
      topIssues: [],
      totalReviews: 0,
      totalIssues: 0,
      improvementScore: null,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    }
  }

  const issueCounter = new Map<string, TopIssuePattern>()
  let totalIssues = 0
  const reviewIds = new Set<string>()

  for (const file of files as any[]) {
    if (file.reviews?.review_id) reviewIds.add(file.reviews.review_id)
    const issues = Array.isArray(file.issues) ? file.issues : []
    for (const issue of issues) {
      const key = `${issue.category}::${normalizeTitle(issue.title)}`
      const existing = issueCounter.get(key)
      if (existing) {
        existing.count++
      } else {
        issueCounter.set(key, {
          title: issue.title ?? 'Unknown issue',
          category: issue.category ?? 'maintainability',
          severity: issue.severity ?? 'info',
          count: 1,
        })
      }
      totalIssues++
    }
  }

  const topIssues = [...issueCounter.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Compute improvement score by comparing first-half vs second-half of period
  const midpoint = new Date((periodStart.getTime() + periodEnd.getTime()) / 2)
  const firstHalfFiles = (files as any[]).filter(
    (f) => new Date(f.reviews?.created_at) < midpoint,
  )
  const secondHalfFiles = (files as any[]).filter(
    (f) => new Date(f.reviews?.created_at) >= midpoint,
  )

  const firstHalfAvg =
    firstHalfFiles.length > 0
      ? firstHalfFiles.reduce((sum: number, f: any) => sum + (Array.isArray(f.issues) ? f.issues.length : 0), 0) /
        firstHalfFiles.length
      : null
  const secondHalfAvg =
    secondHalfFiles.length > 0
      ? secondHalfFiles.reduce((sum: number, f: any) => sum + (Array.isArray(f.issues) ? f.issues.length : 0), 0) /
        secondHalfFiles.length
      : null

  let improvementScore: number | null = null
  if (firstHalfAvg !== null && secondHalfAvg !== null && firstHalfAvg > 0) {
    improvementScore = Math.round(((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100)
  }

  return {
    topIssues,
    totalReviews: (files as any[]).length,
    totalIssues,
    improvementScore,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}
