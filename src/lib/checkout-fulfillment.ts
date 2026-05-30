import { getRazorpayClient } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import { sendOrderConfirmationWhatsApp } from '@/lib/whatsapp';
import { recordSales } from '@/lib/inventory';
import { notifyAdminNewOrder } from '@/lib/notify';
import { createNotification } from '@/lib/notifications';

/**
 * Shared Razorpay order fulfilment.
 *
 * A paid Razorpay order is turned into one `orders` row + N `order_items` rows
 * by this function. It is called from TWO places so an order materializes no
 * matter which signal arrives first:
 *   - the `payment.captured` webhook (server-to-server, the source of truth), and
 *   - the synchronous /api/checkout/verify fallback (browser handler callback),
 *     so the customer's /order/[id] page never 404s while waiting on the webhook
 *     — and so the flow is testable on localhost with no public tunnel.
 *
 * It is fully idempotent on `razorpay_order_id`: whichever caller runs second
 * sees the existing row and returns `duplicate: true` without writing again.
 *
 * The compact line snapshot lives in the Razorpay order notes:
 *   [{"p":"<product_id>","v":"<variant>|null","q":<qty>,"u":<unit_price>}, ...]
 * The unit_price is captured server-side at /api/checkout so fulfilment is
 * idempotent against later product price changes.
 *
 * NOTE: TeaKart has no inventory system — there is intentionally no stock
 * movement here (the master template's applyStockMovement is omitted). Only
 * recordSales (per-product sales counters) is bumped.
 */

type LineDescriptor = {
  productId: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
};

export type FulfillResult =
  | { ok: true; orderId: string; duplicate: boolean }
  | { ok: false; status: number; error: string };

export async function fulfillRazorpayOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  /** Actual fee Razorpay charged on this payment, in paise (fee + tax). Best-effort. */
  razorpayFeePaise: number | null;
  /**
   * When set (the /verify path), the order's notes.user_id must match this id
   * or fulfilment is refused with 403. The webhook omits it — it's already a
   * trusted server-to-server signal.
   */
  expectedUserId?: string;
}): Promise<FulfillResult> {
  const { razorpayOrderId, razorpayPaymentId, razorpayFeePaise, expectedUserId } = params;
  const supabaseAdmin = getSupabaseAdminClient();
  const razorpay = getRazorpayClient();

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
  } catch (err) {
    console.error('[fulfill] orders.fetch failed', err);
    return { ok: false, status: 502, error: 'Failed to fetch order' };
  }

  const notes = (razorpayOrder.notes ?? {}) as Record<string, string>;
  const userId = notes.user_id;
  const addressId = notes.address_id;
  const amountPaid = Number(razorpayOrder.amount) / 100;

  if (!userId || !addressId) {
    return { ok: false, status: 400, error: 'Missing order metadata' };
  }

  if (expectedUserId && userId !== expectedUserId) {
    return { ok: false, status: 403, error: 'This order does not belong to you' };
  }

  let lines: LineDescriptor[] = [];
  if (notes.lines) {
    try {
      const parsed = JSON.parse(notes.lines) as Array<{ p?: string; v?: string | null; q?: number; u?: number }>;
      lines = parsed
        .filter((l) => typeof l.p === 'string' && typeof l.q === 'number' && typeof l.u === 'number')
        .map((l) => ({
          productId: l.p as string,
          variantLabel: l.v && l.v !== 'default' && l.v !== '' ? l.v : null,
          quantity: Math.max(1, Math.floor(l.q as number)),
          unitPrice: l.u as number,
        }));
    } catch {
      return { ok: false, status: 400, error: 'Malformed lines in notes' };
    }
  }

  if (lines.length === 0) {
    return { ok: false, status: 400, error: 'No items in order' };
  }

  // Idempotency — webhook and verify can both run; whoever is second no-ops.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle();

  if (existingErr) {
    console.error('[fulfill] idempotency check failed', existingErr);
    return { ok: false, status: 500, error: 'DB error' };
  }

  if (existing) {
    return { ok: true, orderId: existing.id as string, duplicate: true };
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      address_id: addressId,
      amount_paid: amountPaid,
      status: 'pending',
      payment_status: 'paid',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_fee_paise: razorpayFeePaise,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    // A concurrent caller may have inserted between our check and now. The
    // razorpay_order_id is unique in practice; re-read and treat as duplicate.
    const { data: raced } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();
    if (raced) {
      return { ok: true, orderId: raced.id as string, duplicate: true };
    }
    console.error('[fulfill] order insert failed', insertErr);
    return { ok: false, status: 500, error: 'Failed to create order' };
  }

  const orderId = inserted.id as string;

  const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(
    lines.map((l) => ({
      order_id: orderId,
      product_id: l.productId,
      variant_label: l.variantLabel,
      unit_price: l.unitPrice,
      quantity: l.quantity,
    })),
  );

  if (itemsErr) {
    console.error('[fulfill] order_items insert failed', itemsErr);
    // Order row already in — don't fail fulfilment, but flag for ops.
  }

  // Bump per-product sales counters (best-seller badges + best-selling sort).
  await recordSales(supabaseAdmin, lines);

  // Clear the user's cart after successful checkout. Best-effort.
  await supabaseAdmin.from('users').update({ cart: [] }).eq('id', userId);

  const { error: historyErr } = await supabaseAdmin
    .from('order_status_history')
    .insert({ order_id: orderId, status: 'pending' });

  if (historyErr) {
    console.error('[fulfill] status history insert failed', historyErr);
  }

  // Notifications — best effort, never fail fulfilment on these.
  try {
    const productIds = Array.from(new Set(lines.map((l) => l.productId)));
    const [{ data: userRow }, { data: authUser }, { data: products }, { data: address }] =
      await Promise.all([
        supabaseAdmin.from('users').select('phone, full_name').eq('id', userId).single(),
        supabaseAdmin.auth.admin.getUserById(userId),
        supabaseAdmin.from('products').select('id, name').in('id', productIds),
        supabaseAdmin
          .from('addresses')
          .select('full_address, city, state, pincode')
          .eq('id', addressId)
          .single(),
      ]);

    const productNameById = new Map((products ?? []).map((p) => [p.id, p.name as string]));
    const email = authUser?.user?.email ?? null;
    const phone = userRow?.phone ?? null;
    const formattedAddress = address
      ? `${address.full_address}, ${address.city}, ${address.state} ${address.pincode}`
      : '';

    const linesForTemplate = lines.map((l) => ({
      name: productNameById.get(l.productId) ?? 'Item',
      variantLabel: l.variantLabel,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    }));

    const emailPromise = email
      ? sendOrderConfirmationEmail(email, {
          orderId,
          items: linesForTemplate,
          amountPaid,
          address: formattedAddress,
        }).catch((err) => {
          console.error('[fulfill] email send failed', err);
        })
      : Promise.resolve();

    const whatsappPromise = phone
      ? sendOrderConfirmationWhatsApp(phone, {
          orderId,
          items: linesForTemplate.map(({ name, variantLabel, quantity }) => ({
            name,
            variantLabel,
            quantity,
          })),
          amountPaid,
        }).catch((err) => {
          console.error('[fulfill] whatsapp send failed', err);
        })
      : Promise.resolve();

    const itemsSummary = linesForTemplate
      .map((l) => `${l.name}${l.quantity > 1 ? ` ×${l.quantity}` : ''}`)
      .join(', ');
    const adminPromise = notifyAdminNewOrder({
      orderId,
      amountPaid,
      itemsSummary,
      customerName: (userRow as { full_name?: string | null } | null)?.full_name ?? null,
    }).catch((err) => console.error('[fulfill] admin notify failed', err));

    // In-site notification for the customer (header bell).
    const inAppPromise = createNotification(supabaseAdmin, {
      userId,
      type: 'order_placed',
      title: 'Order placed',
      body: itemsSummary,
      href: `/account/orders/${orderId}`,
    });

    await Promise.all([emailPromise, whatsappPromise, adminPromise, inAppPromise]);
  } catch (err) {
    console.error('[fulfill] notification dispatch failed', err);
  }

  return { ok: true, orderId, duplicate: false };
}
