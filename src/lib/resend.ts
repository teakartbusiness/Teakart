import { Resend } from 'resend';

/**
 * Email via Resend. Everything here is best-effort + env-gated: if
 * RESEND_API_KEY / RESEND_FROM_EMAIL aren't set, sends quietly no-op (return
 * false) and never throw — so a missing/failed email can never break the order,
 * refund, or support flow that triggered it. Paste the two env vars (with a
 * Resend-verified sending domain) and email goes live with no code change.
 */

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

/** e.g. "TeaKart <orders@yourdomain.com>" — must be a Resend-verified domain. */
function fromAddress(): string | null {
  return process.env.RESEND_FROM_EMAIL || null;
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Branded plain-HTML shell matching the auth emails. `bodyHtml` is trusted. */
export function emailShell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 8px;">
      <p style="font-weight: 700; letter-spacing: 0.04em;">TeaKart</p>
      <h2 style="margin: 8px 0 12px;">${esc(heading)}</h2>
      ${bodyHtml}
      <p style="margin-top: 24px; color: #666;">— The TeaKart team</p>
    </div>
  `;
}

/** Send an email. No-op (false) if Resend isn't configured. Never throws. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const c = getClient();
  const from = fromAddress();
  if (!c || !from || !to) return false;
  try {
    const { error } = await c.emails.send({ from, to, subject, html });
    if (error) {
      console.error('[resend] send error', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[resend] send threw', e);
    return false;
  }
}

export type EmailOrderLine = {
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
};

export async function sendOrderConfirmationEmail(
  to: string,
  orderDetails: {
    orderId: string;
    items: EmailOrderLine[];
    amountPaid: number;
    address: string;
  }
): Promise<void> {
  const { orderId, items, amountPaid, address } = orderDetails;

  const itemRows = items
    .map((it) => {
      const label = it.variantLabel
        ? `${esc(it.name)} <span style="color:#666">· ${esc(it.variantLabel)}</span>`
        : esc(it.name);
      const line = it.quantity > 1 ? ` × ${it.quantity}` : '';
      const subtotal = (it.unitPrice * it.quantity).toLocaleString('en-IN');
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${label}${line}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${subtotal}</td>
        </tr>
      `;
    })
    .join('');

  const body = `
    <p>Thanks for your order. Here are the details:</p>
    <p><strong>Order ID:</strong> ${esc(orderId)}</p>
    <table style="border-collapse: collapse; width: 100%; margin-top: 12px;">
      <thead>
        <tr style="background:#f7f4ee">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total paid</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>₹${amountPaid.toLocaleString('en-IN')}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Shipping address</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${esc(address)}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top: 16px;">We'll be in touch with shipping updates.</p>
  `;

  await sendEmail(to, 'Order confirmed — TeaKart', emailShell('Order confirmed', body));
}
