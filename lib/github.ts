export interface PrMeta {
  title: string
  body: string
  repo: string
  owner: string
  number: number
  author: string
  base: string
  head: string
  htmlUrl: string
}

export interface PrFile {
  filename: string
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged'
  additions: number
  deletions: number
  patch?: string
  previous_filename?: string
}

export function parsePrUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+?)\/pull\/(\d+)/,
  )
  if (!match) return null
  return { owner: match[1], repo: match[2], number: parseInt(match[3], 10) }
}

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ai-pr-reviewer/1.0',
  }
  if (token) headers['Authorization'] = `token ${token}`

  const res = await fetch(`https://api.github.com${path}`, { headers })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

export async function fetchPrMeta(
  owner: string,
  repo: string,
  number: number,
  token?: string,
): Promise<PrMeta> {
  const pr = await ghFetch<{
    title: string
    body: string | null
    number: number
    html_url: string
    user: { login: string }
    base: { ref: string }
    head: { ref: string }
  }>(`/repos/${owner}/${repo}/pulls/${number}`, token)

  return {
    title: pr.title,
    body: pr.body ?? '',
    repo,
    owner,
    number: pr.number,
    author: pr.user.login,
    base: pr.base.ref,
    head: pr.head.ref,
    htmlUrl: pr.html_url,
  }
}

export async function fetchPrFiles(
  owner: string,
  repo: string,
  number: number,
  token?: string,
): Promise<PrFile[]> {
  // GitHub returns max 300 files; paginate if needed
  const files: PrFile[] = []
  let page = 1

  while (true) {
    const batch = await ghFetch<PrFile[]>(
      `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100&page=${page}`,
      token,
    )
    files.push(...batch)
    if (batch.length < 100) break
    page++
    if (page > 3) break // cap at 300 files
  }

  return files
}

export function buildDiffFromFiles(files: PrFile[], meta: PrMeta): string {
  const lines: string[] = []

  for (const file of files) {
    if (!file.patch) continue

    const aPath = file.previous_filename ?? file.filename
    const bPath = file.filename

    lines.push(`diff --git a/${aPath} b/${bPath}`)

    if (file.status === 'added') {
      lines.push('new file mode 100644')
    } else if (file.status === 'removed') {
      lines.push('deleted file mode 100644')
    } else if (file.status === 'renamed') {
      lines.push(`rename from ${aPath}`)
      lines.push(`rename to ${bPath}`)
    }

    lines.push(`--- a/${aPath}`)
    lines.push(`+++ b/${bPath}`)
    lines.push(file.patch)
  }

  return lines.join('\n')
}

export async function postReviewToGitHub(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  token: string,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'ai-pr-reviewer/1.0',
      },
      body: JSON.stringify({ body, event: 'COMMENT' }),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to post review: ${res.status} ${text.slice(0, 200)}`)
  }

  const data = await res.json() as { html_url: string }
  return data.html_url
}
