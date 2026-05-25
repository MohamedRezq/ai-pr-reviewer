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

    const { getUserRules } = await import('@/lib/supabase/db')
    const rules = await getUserRules(supabase, user.id)
    return NextResponse.json({ rules })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { rule_text, repo_pattern = '*' } = body

    if (!rule_text || typeof rule_text !== 'string' || rule_text.trim().length === 0) {
      return NextResponse.json({ error: 'rule_text is required' }, { status: 400 })
    }
    if (rule_text.length > 500) {
      return NextResponse.json({ error: 'Rule text must be under 500 characters' }, { status: 400 })
    }

    const { createRule } = await import('@/lib/supabase/db')
    const rule = await createRule(supabase, {
      user_id: user.id,
      repo_pattern,
      rule_text: rule_text.trim(),
      enabled: true,
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, rule_text, repo_pattern, enabled } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { updateRule } = await import('@/lib/supabase/db')
    await updateRule(supabase, id, user.id, { rule_text, repo_pattern, enabled })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { deleteRule } = await import('@/lib/supabase/db')
    await deleteRule(supabase, id, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
