import type { Metadata } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import AddressList from '@/components/account/address-list'

export const metadata: Metadata = {
  title: 'Saved addresses',
  robots: { index: false, follow: false },
}

export default async function AddressesPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Saved addresses
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Used when you place an order. Editing creates a new copy so old orders keep their original address.
        </p>
      </div>
      <AddressList addresses={addresses ?? []} />
    </div>
  )
}
