import { createClient } from '@/lib/supabase/server'
import { getReview } from '@/lib/supabase/db'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const review = await getReview(supabase, id, user?.id)

  if (!review) {
    return Response.json({ error: 'Review not found' }, { status: 404 })
  }

  return Response.json({ review })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { deleteReview } = await import('@/lib/supabase/db')
  await deleteReview(supabase, id, user.id)

  return Response.json({ success: true })
}
