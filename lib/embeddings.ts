import OpenAI from 'openai'
import type { Issue } from './types'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

/**
 * Generates a vector embedding for a code review issue using OpenAI text-embedding-3-small.
 * Returns a 1536-dimension float array.
 */
export async function embedIssue(issue: Issue, filePath: string): Promise<number[]> {
  const client = getClient()
  const text = `[${issue.severity}/${issue.category}] ${issue.title}: ${issue.description} (file: ${filePath})`

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  })

  return response.data[0].embedding
}

/**
 * Batch-embeds multiple issues. Returns an array of { issue, filePath, embedding } objects.
 */
export async function embedIssues(
  issues: Array<{ issue: Issue; filePath: string }>,
): Promise<Array<{ issue: Issue; filePath: string; embedding: number[] }>> {
  if (issues.length === 0) return []

  const client = getClient()
  const texts = issues.map(
    ({ issue, filePath }) =>
      `[${issue.severity}/${issue.category}] ${issue.title}: ${issue.description} (file: ${filePath})`,
  )

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 1536,
  })

  return issues.map(({ issue, filePath }, i) => ({
    issue,
    filePath,
    embedding: response.data[i].embedding,
  }))
}
