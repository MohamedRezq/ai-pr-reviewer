import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeCoachingInsights } from '@/lib/coaching'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const insights = await computeCoachingInsights(supabase, user.id)
    return NextResponse.json({ insights })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
