import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import WishlistView from '@/components/account/wishlist-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Wishlist',
  robots: { index: false, follow: false },
}

export default async function WishlistPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/account/wishlist')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Wishlist
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Items you&apos;ve saved. Move them to your cart when you&apos;re ready to buy.
        </p>
      </div>
      <WishlistView />
    </div>
  )
}
