import { createClient } from '@/lib/supabase/server'
import { parsePrUrl, postReviewToGitHub } from '@/lib/github'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.provider_token
  if (!token) {
    return Response.json(
      { error: 'GitHub token not available. Please sign out and sign in again with GitHub.' },
      { status: 401 },
    )
  }

  let body: { prUrl?: string; body?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { prUrl, body: reviewBody } = body
  if (!prUrl || !reviewBody) {
    return Response.json({ error: 'prUrl and body are required' }, { status: 400 })
  }

  const parsed = parsePrUrl(prUrl)
  if (!parsed) return Response.json({ error: 'Invalid GitHub PR URL' }, { status: 400 })

  try {
    const url = await postReviewToGitHub(
      parsed.owner,
      parsed.repo,
      parsed.number,
      reviewBody,
      token,
    )
    return Response.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to post review'
    return Response.json({ error: message }, { status: 500 })
  }
}
