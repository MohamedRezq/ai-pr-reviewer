import type { ReviewerSuggestion } from './types'

interface GitHubCommit {
  author?: { login?: string } | null
  commit?: { author?: { name?: string } | null } | null
}

/**
 * Uses GitHub's commits API to find who has contributed most to a given file path.
 * Returns a ReviewerSuggestion with the top contributor and ownership %.
 */
export async function getReviewerSuggestion(
  owner: string,
  repo: string,
  filePath: string,
  githubToken?: string,
): Promise<ReviewerSuggestion | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`

    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filePath)}&per_page=30`
    const res = await fetch(url, { headers })
    if (!res.ok) return null

    const commits: GitHubCommit[] = await res.json()
    if (!Array.isArray(commits) || commits.length === 0) return null

    const authorCounts = new Map<string, number>()
    for (const commit of commits) {
      const login =
        commit.author?.login ?? commit.commit?.author?.name ?? 'unknown'
      authorCounts.set(login, (authorCounts.get(login) ?? 0) + 1)
    }

    let topAuthor = ''
    let topCount = 0
    for (const [author, count] of authorCounts) {
      if (count > topCount) {
        topCount = count
        topAuthor = author
      }
    }

    if (!topAuthor || topAuthor === 'unknown') return null

    const ownershipPct = Math.round((topCount / commits.length) * 100)
    return {
      suggestedReviewer: topAuthor,
      ownershipPct,
      recentCommits: topCount,
    }
  } catch {
    return null
  }
}
