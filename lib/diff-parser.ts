import type { DiffFile, FileChangeType } from './types'

const MAX_PATCH_CHARS = 32_000

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function detectChangeType(header: string): FileChangeType {
  if (header.includes('new file mode')) return 'added'
  if (header.includes('deleted file mode')) return 'deleted'
  if (header.includes('rename from') || header.includes('similarity index')) return 'renamed'
  return 'modified'
}

function countChanges(patch: string): { additions: number; deletions: number } {
  let additions = 0
  let deletions = 0
  for (const line of patch.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++
  }
  return { additions, deletions }
}

function extractPath(header: string, side: 'a' | 'b'): string {
  const match = header.match(new RegExp(`diff --git a/(.+?) b/(.+?)(?:\\n|$)`))
  if (!match) return ''
  return side === 'a' ? match[1] : match[2]
}

export function parseDiff(rawDiff: string): DiffFile[] {
  if (!rawDiff.trim()) return []

  const fileBlocks = rawDiff.split(/(?=^diff --git )/m).filter(Boolean)
  const files: DiffFile[] = []

  for (const block of fileBlocks) {
    const firstLine = block.split('\n')[0]
    if (!firstLine.startsWith('diff --git')) continue

    const path = extractPath(firstLine + '\n', 'b') || firstLine.replace('diff --git a/', '').split(' b/')[0]
    const oldPath = extractPath(firstLine + '\n', 'a') || path
    const changeType = detectChangeType(block)

    const patchStart = block.indexOf('\n@@')
    let patch = patchStart >= 0 ? block.slice(patchStart + 1) : ''

    if (patch.length > MAX_PATCH_CHARS) {
      const truncatedAt = MAX_PATCH_CHARS
      const lastNewline = patch.lastIndexOf('\n', truncatedAt)
      patch = patch.slice(0, lastNewline > 0 ? lastNewline : truncatedAt)
      patch += '\n\\ [Truncated — file too large, showing first portion]'
    }

    const { additions, deletions } = countChanges(patch)

    if (path) {
      files.push({ path, oldPath, changeType, patch, additions, deletions })
    }
  }

  return files
}

export function estimateDiffTokens(files: DiffFile[]): number {
  return files.reduce((sum, f) => sum + estimateTokens(f.patch) + 200, 0)
}

export function summarizeDiff(files: DiffFile[]): string {
  const total = files.reduce((s, f) => s + f.additions + f.deletions, 0)
  const added = files.filter(f => f.changeType === 'added').length
  const deleted = files.filter(f => f.changeType === 'deleted').length
  const modified = files.filter(f => f.changeType === 'modified').length
  const renamed = files.filter(f => f.changeType === 'renamed').length

  const parts: string[] = [`${files.length} file${files.length !== 1 ? 's' : ''} changed`]
  if (modified) parts.push(`${modified} modified`)
  if (added) parts.push(`${added} added`)
  if (deleted) parts.push(`${deleted} deleted`)
  if (renamed) parts.push(`${renamed} renamed`)
  parts.push(`${total} line changes`)

  return parts.join(', ')
}
