import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function verifyGitHubSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expectedSig = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  const event = req.headers.get('x-github-event')

  // Verify signature if global webhook secret is set
  const globalSecret = process.env.GITHUB_WEBHOOK_SECRET
  if (globalSecret && !verifyGitHubSignature(rawBody, signature, globalSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Only handle PR opened/synchronize events
  if (event !== 'pull_request') {
    return NextResponse.json({ received: true, skipped: true })
  }

  let payload: {
    action: string
    pull_request: {
      number: number
      html_url: string
      title: string
      head: { repo: { full_name: string } }
    }
    repository: { full_name: string }
    installation?: { id: number }
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, pull_request, repository } = payload

  if (action !== 'opened' && action !== 'synchronize') {
    return NextResponse.json({ received: true, action, skipped: true })
  }

  const repoName = repository.full_name
  const prUrl = pull_request.html_url
  const prNumber = pull_request.number

  // Look up repo settings to check if auto-review is enabled
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Find users who have auto-review enabled for this repo
    const { data: repoSettings } = await supabase
      .from('repo_settings')
      .select('user_id, path_includes, path_excludes, models, webhook_secret')
      .eq('repo_name', repoName)
      .eq('auto_review_enabled', true)

    if (!repoSettings || repoSettings.length === 0) {
      return NextResponse.json({ received: true, auto_review: false })
    }

    // Verify per-repo webhook secret if set
    const repoConfig = repoSettings[0]
    if (repoConfig.webhook_secret && !verifyGitHubSignature(rawBody, signature, repoConfig.webhook_secret)) {
      return NextResponse.json({ error: 'Invalid repo webhook signature' }, { status: 401 })
    }

    // Trigger auto-review by calling the review API
    const { getAppUrl } = await import('@/lib/app-url')
    const baseUrl = getAppUrl()
    const reviewResponse = await fetch(`${baseUrl}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prUrl,
        models: repoConfig.models ?? ['claude-sonnet-4-6'],
      }),
    })

    const ok = reviewResponse.ok

    console.log(
      JSON.stringify({
        event: 'webhook_auto_review',
        repo: repoName,
        pr: prNumber,
        action,
        triggered: ok,
      }),
    )

    return NextResponse.json({
      received: true,
      auto_review: true,
      pr: prNumber,
      repo: repoName,
      triggered: ok,
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true, error: 'Processing failed' }, { status: 500 })
  }
}
