/**
 * WhatsApp via the Meta Graph API. Best-effort + env-gated: no-ops (returns
 * false) and never throws when WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID
 * aren't set, so a missing/failed message can't break the flow that triggered it.
 *
 * IMPORTANT (Meta policy): free-form text only delivers within 24h of a
 * customer-initiated message. Business-initiated/proactive notifications
 * (order confirmations etc.) require a pre-approved message TEMPLATE created in
 * Meta Business Manager. So pasting env makes email fully live, but WhatsApp
 * proactive sends also need templates — until then these calls will fail
 * silently (logged, never thrown). See SETUP.md.
 */

export function whatsappConfigured(): boolean {
  return !!process.env.WHATSAPP_API_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID;
}

/** Meta wants a country-coded number with no '+' or separators. */
function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

/** Send a free-form WhatsApp text. No-op (false) if unconfigured. Never throws. */
export async function sendWhatsAppText(to: string | null | undefined, body: string): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  const phone = normalizePhone(to);
  if (!phone) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { body, preview_url: false },
        }),
      }
    );
    if (!res.ok) {
      console.error(`[whatsapp] API error (${res.status})`, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[whatsapp] send threw', e);
    return false;
  }
}

export type WhatsAppOrderLine = {
  name: string;
  variantLabel: string | null;
  quantity: number;
};

export async function sendOrderConfirmationWhatsApp(
  to: string,
  orderDetails: {
    orderId: string;
    items: WhatsAppOrderLine[];
    amountPaid: number;
  }
): Promise<void> {
  const { orderId, items, amountPaid } = orderDetails;
  const itemLines = items
    .map((it) => {
      const variant = it.variantLabel ? ` · ${it.variantLabel}` : '';
      const qty = it.quantity > 1 ? ` × ${it.quantity}` : '';
      return `• ${it.name}${variant}${qty}`;
    })
    .join('\n');

  const body =
    `Hi! Your TeaKart order is confirmed.\n\n` +
    `Order ID: ${orderId}\n` +
    `Items:\n${itemLines}\n\n` +
    `Amount paid: ₹${amountPaid.toLocaleString('en-IN')}\n\n` +
    `We'll share shipping updates here. Thank you for shopping with us!`;

  await sendWhatsAppText(to, body);
}
