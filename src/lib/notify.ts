import 'server-only';
import { sendEmail, emailShell, esc } from './resend';
import { sendWhatsAppText } from './whatsapp';

/**
 * Event notifications — composes email (Resend) + WhatsApp for each store event.
 * Every send is best-effort + env-gated (see lib/resend + lib/whatsapp): nothing
 * here ever throws or blocks the request that triggered it. Admin target is
 * ADMIN_EMAIL + ADMIN_WHATSAPP_NUMBER (each optional — whichever is set is used).
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';
const adminEmail = () => process.env.ADMIN_EMAIL || null;
const adminPhone = () => process.env.ADMIN_WHATSAPP_NUMBER || null;
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const link = (path: string, label: string) => (SITE ? `<p><a href="${SITE}${path}">${label}</a></p>` : '');

async function toAdmin(subject: string, html: string, wa: string) {
  const ae = adminEmail();
  const ap = adminPhone();
  if (ae) await sendEmail(ae, subject, html);
  if (ap) await sendWhatsAppText(ap, wa);
}

export async function notifyAdminNewOrder(p: {
  orderId: string;
  amountPaid: number;
  itemsSummary: string;
  customerName: string | null;
}) {
  const short = p.orderId.slice(0, 8);
  await toAdmin(
    `New order ${short} — ${rupees(p.amountPaid)}`,
    emailShell(
      'New order received',
      `<p><strong>Order:</strong> ${esc(p.orderId)}</p>
       <p><strong>Customer:</strong> ${esc(p.customerName ?? '—')}</p>
       <p><strong>Items:</strong> ${esc(p.itemsSummary)}</p>
       <p><strong>Total:</strong> ${rupees(p.amountPaid)}</p>
       ${link(`/admin/orders/${p.orderId}`, 'View in admin')}`,
    ),
    `New TeaKart order ${short} — ${rupees(p.amountPaid)}\n${p.customerName ?? ''}\n${p.itemsSummary}`,
  );
}
