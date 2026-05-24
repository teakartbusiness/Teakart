import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import CartView from '@/components/cart/cart-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false },
}

export default async function CartPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/cart')

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Your cart
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Review items, change quantities, then proceed to checkout.
        </p>
      </div>
      <div className="mt-10">
        <CartView />
      </div>
    </main>
  )
}
