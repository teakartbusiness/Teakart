import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getRazorpayClient, verifyPaymentSignature } from '@/lib/razorpay';
import { fulfillRazorpayOrder } from '@/lib/checkout-fulfillment';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

/**
 * Synchronous payment verification + order materialization.
 *
 * Called by the Razorpay Checkout `handler` callback the instant a payment
 * succeeds. It verifies the handler signature (proof of a genuine payment) and
 * then creates the order synchronously via the shared fulfilment helper, so:
 *   - the /order/[id] page can be opened by DB id and never 404s on a webhook race;
 *   - the real payment flow is testable on localhost with NO public tunnel,
 *     because order creation no longer depends on the async webhook.
 *
 * The webhook remains the backstop: it and this endpoint share one idempotent
 * helper keyed on razorpay_order_id, so whoever runs second is a no-op.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkRateLimit(
    request,
    { name: 'checkout-verify', requests: 10, window: '1 m' },
    user.id,
  );
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  // The handler signature is HMAC(order_id|payment_id, key_secret). Only a
  // genuine Razorpay payment confirmation produces it.
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  // Capture the actual fee (best-effort). The fee/tax are populated once the
  // payment is captured; if not yet available we store null and the webhook,
  // when it eventually runs, finds the order already created and leaves it as-is.
  let razorpayFeePaise: number | null = null;
  try {
    const payment = (await getRazorpayClient().payments.fetch(razorpay_payment_id)) as {
      order_id?: string;
      fee?: number;
      tax?: number;
    };
    if (payment.order_id && payment.order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Payment does not match order' }, { status: 400 });
    }
    if (typeof payment.fee === 'number') {
      razorpayFeePaise = payment.fee + (typeof payment.tax === 'number' ? payment.tax : 0);
    }
  } catch (err) {
    // Non-fatal — fee capture is best-effort and the webhook is the backstop.
    console.error('[api/checkout/verify] payments.fetch failed', err);
  }

  const result = await fulfillRazorpayOrder({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpayFeePaise,
    expectedUserId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ orderId: result.orderId });
}
