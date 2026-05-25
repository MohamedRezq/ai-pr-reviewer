import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  try {
    const { supabase, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listRepoSettings } = await import('@/lib/supabase/db')
    const repos = await listRepoSettings(supabase, user.id)
    return NextResponse.json({ repos })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      repo_name,
      path_includes = [],
      path_excludes = [],
      auto_review_enabled = false,
      models = ['claude-3-5-sonnet-20241022'],
      webhook_secret,
    } = body

    if (!repo_name || typeof repo_name !== 'string') {
      return NextResponse.json({ error: 'repo_name is required (e.g. owner/repo)' }, { status: 400 })
    }

    const { upsertRepoSettings } = await import('@/lib/supabase/db')
    const settings = await upsertRepoSettings(supabase, {
      user_id: user.id,
      repo_name,
      path_includes,
      path_excludes,
      auto_review_enabled,
      models,
      webhook_secret: webhook_secret ?? null,
    })

    return NextResponse.json({ settings }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
