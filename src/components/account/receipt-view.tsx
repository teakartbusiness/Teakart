'use client'

import Link from 'next/link'
import { Printer } from 'lucide-react'
import { displayVariant } from '@/lib/orders'

interface Line {
  productName: string
  variantLabel: string | null
  unitPrice: number
  quantity: number
}

interface Props {
  brandName: string
  orderId: string
  orderShortId: string
  orderedAt: string
  paymentId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  address: { full_address: string; city: string; state: string; pincode: string } | null
  lines: Line[]
  totalRupees: number
}

/**
 * Print-friendly receipt. The "Save as PDF" button just triggers
 * `window.print()` — every modern browser/OS exposes "Save as PDF" as the
 * default destination in the print dialog. No PDF library required.
 *
 * The page-level print stylesheet strips the toolbar and any surrounding
 * chrome so the printed output is just the receipt sheet.
 */
export default function ReceiptView({
  brandName,
  orderId,
  orderShortId,
  orderedAt,
  paymentId,
  customerName,
  customerEmail,
  customerPhone,
  address,
  lines,
  totalRupees,
}: Props) {
  function handlePrint() {
    if (typeof window === 'undefined') return
    // Browsers default the "Save as PDF" filename to document.title. Swap
    // it out for a clean "TeaKart-Receipt-<short id>" right before printing
    // so the saved file lands with a sensible name, then restore the tab
    // title once the dialog closes.
    const originalTitle = document.title
    document.title = `TeaKart-Receipt-${orderShortId}`
    window.print()
    // afterprint fires whether the user cancelled or saved.
    const restore = () => {
      document.title = originalTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 print:max-w-none print:bg-white print:p-0 print:py-0">
      {/* Top toolbar — hidden during print. */}
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/account/orders/${orderId}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to order
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          <Printer className="size-4" />
          Save / print as PDF
        </button>
      </div>

      {/* Receipt artifact — strictly black ink on white background regardless
          of theme. A printable document needs to look identical on screen and
          on paper, which is why this section bypasses theme tokens and uses
          only `black` / `white` (no grays). */}
      <article
        id="receipt"
        className="rounded-2xl border border-black bg-white p-6 text-black shadow-sm sm:p-8 print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        {/* Brand header */}
        <header className="flex items-baseline justify-between border-b border-black pb-4">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-black">
            {brandName}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-black">
            Receipt
          </p>
        </header>

        {/* Order meta */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Receipt no." value={`#${orderShortId}`} mono />
          <Field
            label="Order placed"
            value={new Date(orderedAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          {paymentId && <Field label="Payment ref." value={paymentId} mono />}
          <Field
            label="Issued"
            value={new Date().toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </section>

        {/* Customer + address */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black">
              Billed to
            </p>
            <p className="mt-1 text-sm text-black">
              {customerName ?? '—'}
              {customerEmail && (
                <>
                  <br />
                  <span className="text-black">{customerEmail}</span>
                </>
              )}
              {customerPhone && (
                <>
                  <br />
                  <span className="text-black">{customerPhone}</span>
                </>
              )}
            </p>
          </div>
          {address && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-black">
                Delivery address
              </p>
              <p className="mt-1 text-sm text-black">
                {address.full_address}
                <br />
                {address.city}, {address.state} — {address.pincode}
              </p>
            </div>
          )}
        </section>

        {/* Line items */}
        <section className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black text-xs uppercase tracking-wider text-black">
                <th className="py-2 text-left font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit price</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-black">
                    No items on this order.
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => {
                  const v = displayVariant(line.variantLabel)
                  return (
                    <tr key={i} className="border-b border-black">
                      <td className="py-3 align-top text-black">
                        <div className="font-medium">{line.productName}</div>
                        {v && (
                          <div className="text-xs text-black">{v}</div>
                        )}
                      </td>
                      <td className="py-3 text-right align-top tabular-nums text-black">
                        {line.quantity}
                      </td>
                      <td className="py-3 text-right align-top tabular-nums text-black">
                        ₹{line.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right align-top tabular-nums text-black">
                        ₹{(line.unitPrice * line.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <Row
            label="Total paid"
            value={`₹${totalRupees.toLocaleString('en-IN')}`}
            emphasis
          />
        </section>

        <footer className="mt-10 border-t border-black pt-4 text-center text-xs text-black">
          Thank you for shopping with {brandName}.
          <br />
          This receipt was auto-generated and serves as proof of purchase.
        </footer>
      </article>
    </main>
  )
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-black">
        {label}
      </p>
      <p className={mono ? 'mt-1 font-mono text-xs text-black break-all' : 'mt-1 text-sm text-black'}>
        {value}
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={emphasis ? 'font-medium text-black' : 'text-black'}>
        {label}
      </span>
      <span className={`tabular-nums text-black ${emphasis ? 'text-base font-semibold' : ''}`}>
        {value}
      </span>
    </div>
  )
}
