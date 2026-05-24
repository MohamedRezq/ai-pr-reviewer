import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listReviews } from '@/lib/supabase/db'
import { ReviewHistoryCard } from '@/components/ReviewHistoryCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/reviews')

  const reviews = await listReviews(supabase, user.id, { limit: 50 })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Review History</h1>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="size-4" />
          New
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-20 text-center">
          <p className="text-zinc-500">No reviews saved yet.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in and run a review — it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewHistoryCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
