import Razorpay from 'razorpay';
import crypto from 'crypto';

let cachedClient: Razorpay | null = null;

/**
 * Lazy Razorpay client. Throws at call time (not module load) if the keys
 * are missing — keeps the production build green even before keys are set.
 */
export function getRazorpayClient(): Razorpay {
  if (!cachedClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      );
    }
    cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return cachedClient;
}

/** @deprecated use getRazorpayClient() */
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return Reflect.get(getRazorpayClient(), prop);
  },
});

/**
 * Verify the signature returned by the Razorpay Checkout handler
 * (handler-mode payment confirmation, not webhooks).
 * Signed with key_secret over "orderId|paymentId".
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return timingSafeEqual(expectedSignature, signature);
}

/**
 * Verify a Razorpay webhook signature.
 * Signed with RAZORPAY_WEBHOOK_SECRET (configured in the Razorpay dashboard
 * when creating the webhook) over the raw request body.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[razorpay] RAZORPAY_WEBHOOK_SECRET is not set');
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
