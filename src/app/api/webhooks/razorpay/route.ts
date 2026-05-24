import { NextResponse } from 'next/server';
import { getRazorpayClient, verifyWebhookSignature } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import { sendOrderConfirmationWhatsApp } from '@/lib/whatsapp';
import { recordSales } from '@/lib/inventory';
import { notifyAdminNewOrder } from '@/lib/notify';

/**
 * Razorpay payment.captured webhook.
 *
 * Checkout notes carry a compact `lines` JSON:
 *   [{"p":"<product_id>","v":"<variant>|null","q":<qty>,"u":<unit_price>}, ...]
 * The unit_price is captured server-side at /api/checkout so the webhook is
 * idempotent against later product price changes.
 *
 * Writes one `orders` row and N `order_items` rows.
 */
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient();
  const razorpay = getRazorpayClient();
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  // Verify signature BEFORE parsing — Razorpay signs the raw body bytes.
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          fee?: number;
          tax?: number;
        };
      };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const paymentEntity = event?.payload?.payment?.entity;
  const razorpay_order_id = paymentEntity?.order_id;
  const razorpay_payment_id = paymentEntity?.id;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return NextResponse.json({ error: 'Missing payment ids' }, { status: 400 });
  }

  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Capture the actual fee Razorpay charged on this payment (paise).
  // Both `fee` and `tax` are reported in paise.
  const razorpayFeePaise =
    typeof paymentEntity?.fee === 'number'
      ? paymentEntity.fee + (typeof paymentEntity.tax === 'number' ? paymentEntity.tax : 0)
      : null;

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
  } catch (err) {
    console.error('[razorpay-webhook] orders.fetch failed', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }

  const notes = (razorpayOrder.notes ?? {}) as Record<string, string>;
  const userId = notes.user_id;
  const addressId = notes.address_id;
  const amountPaid = Number(razorpayOrder.amount) / 100;

  if (!userId || !addressId) {
    return NextResponse.json({ error: 'Missing order metadata' }, { status: 400 });
  }

  type LineDescriptor = { productId: string; variantLabel: string | null; quantity: number; unitPrice: number };
  let lines: LineDescriptor[] = [];

  if (notes.lines) {
    // Multi-item path — parse the compact JSON snapshot.
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
      return NextResponse.json({ error: 'Malformed lines in notes' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 });
  }

  // Idempotency — webhook can fire more than once.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('razorpay_order_id', razorpay_order_id)
    .maybeSingle();

  if (existingErr) {
    console.error('[razorpay-webhook] idempotency check failed', existingErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      address_id: addressId,
      amount_paid: amountPaid,
      status: 'pending',
      payment_status: 'paid',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_fee_paise: razorpayFeePaise,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[razorpay-webhook] order insert failed', insertErr);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  const orderId = inserted.id;

  // Write line items.
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
    console.error('[razorpay-webhook] order_items insert failed', itemsErr);
    // Order row already in — don't fail the webhook, but flag for ops.
  }

  // Bump per-product sales counters (best-seller badges + best-selling sort).
  await recordSales(supabaseAdmin, lines);

  // Clear the user's cart after successful checkout. Best-effort.
  await supabaseAdmin.from('users').update({ cart: [] }).eq('id', userId);

  const { error: historyErr } = await supabaseAdmin
    .from('order_status_history')
    .insert({ order_id: orderId, status: 'pending' });

  if (historyErr) {
    console.error('[razorpay-webhook] status history insert failed', historyErr);
  }

  // Notifications — best effort, never fail the webhook on these.
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
          console.error('[razorpay-webhook] email send failed', err);
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
          console.error('[razorpay-webhook] whatsapp send failed', err);
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
    }).catch((err) => console.error('[razorpay-webhook] admin notify failed', err));

    await Promise.all([emailPromise, whatsappPromise, adminPromise]);
  } catch (err) {
    console.error('[razorpay-webhook] notification dispatch failed', err);
  }

  return NextResponse.json({ received: true, orderId }, { status: 200 });
}
