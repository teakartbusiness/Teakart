import { notFound, redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import OrderConfirmationPoll from '@/components/checkout/order-confirmation-poll';
import OrderConfirmationCard from '@/components/checkout/order-confirmation-card';
import { ORDER_ITEMS_SELECT, sortItems, type OrderItemWithProduct } from '@/lib/orders';
import type { Address, Order, OrderStatus, PaymentStatus } from '@/types';

type Props = {
  params: Promise<{ orderId: string }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

type OrderWithRelations = Order & {
  items?: OrderItemWithProduct[];
  address: Pick<Address, 'full_address' | 'city' | 'state' | 'pincode'> | null;
};

export const metadata = {
  title: 'Order details',
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=/order/${orderId}`);
  }

  const lookupColumn = UUID_REGEX.test(orderId) ? 'id' : 'razorpay_order_id';

  const { data } = await supabase
    .from('orders')
    .select(
      `id, user_id, amount_paid, status, payment_status, razorpay_order_id, created_at, ${ORDER_ITEMS_SELECT}, address:addresses(full_address, city, state, pincode)`
    )
    .eq(lookupColumn, orderId)
    .maybeSingle();

  const order = data as OrderWithRelations | null;

  if (!order) {
    return <OrderConfirmationPoll lookupKey={orderId} />;
  }

  if (order.user_id !== user.id) {
    notFound();
  }

  const items = sortItems(order.items ?? []);

  const formattedAddress = order.address
    ? `${order.address.full_address}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`
    : '—';

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-7" strokeWidth={2.25} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {order.payment_status === 'paid' ? 'Thank you for your order!' : STATUS_LABELS[order.status]}
        </h1>
        <p className="mt-2 max-w-md text-base text-muted-foreground">
          We&apos;ve received your order and will reach out on WhatsApp with shipping updates.
        </p>
      </div>

      <OrderConfirmationCard
        order={{
          id: order.id,
          amount_paid: order.amount_paid,
          status: order.status,
          payment_status: order.payment_status,
          razorpay_order_id: order.razorpay_order_id,
          created_at: order.created_at,
          items,
          formattedAddress,
        }}
      />
    </main>
  );
}
