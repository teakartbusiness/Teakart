import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { fulfillRazorpayOrder } from '@/lib/checkout-fulfillment';

/**
 * Razorpay payment.captured webhook.
 *
 * The server-to-server backstop for order creation. It verifies the webhook
 * signature, gates on `payment.captured`, computes the actual Razorpay fee from
 * the payment entity, then delegates order materialization to the shared
 * fulfilment helper (the same helper /api/checkout/verify calls synchronously).
 *
 * The helper is idempotent on razorpay_order_id, so whether the webhook or the
 * synchronous verify endpoint runs first, the order is created exactly once.
 */
export async function POST(request: Request) {
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

  const result = await fulfillRazorpayOrder({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpayFeePaise,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.duplicate) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  return NextResponse.json({ received: true, orderId: result.orderId }, { status: 200 });
}
