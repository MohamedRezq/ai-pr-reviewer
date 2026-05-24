import { createClient } from '@/lib/supabase/server'
import { listReviews } from '@/lib/supabase/db'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0'))

  const reviews = await listReviews(supabase, user.id, { limit, offset })

  return Response.json({ reviews, count: reviews.length })
}
