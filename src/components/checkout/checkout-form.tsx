'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AddressSelector } from './address-selector';
import type { Address, Product, Variant } from '@/types';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
};

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export type CheckoutLine = {
  productId: string;
  name: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
};

type CheckoutFormProps = {
  mode: 'cart' | 'buynow';
  lines: CheckoutLine[];
  total: number;
  buyNowProduct: Product | null;
  buyNowVariant: Variant | null;
};

const emptyAddressForm = { full_address: '', city: '', state: '', pincode: '' };

export function CheckoutForm({ mode, lines, buyNowProduct, buyNowVariant }: CheckoutFormProps) {
  const router = useRouter();

  // Quantities are editable here for both buy-now and cart flows; the order
  // total recalculates live and the edited lines are what get submitted.
  const [editLines, setEditLines] = useState<CheckoutLine[]>(lines);
  const computedTotal = editLines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  const setLineQty = (idx: number, qty: number) =>
    setEditLines((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, quantity: Math.max(1, Math.min(99, Math.floor(qty) || 1)) } : l,
      ),
    );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [placing, setPlacing] = useState(false);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const res = await fetch('/api/addresses', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load addresses');
      const data = (await res.json()) as Address[];
      const visible = (data ?? []).filter((a) => !a.is_deleted);
      setAddresses(visible);
      setSelectedAddress((prev) => {
        if (prev && visible.some((a) => a.id === prev.id)) return prev;
        return visible[0] ?? null;
      });
    } catch (err) {
      console.error(err);
      toast.error('Could not load saved addresses');
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NEXT_PUBLIC_PAYMENT_MODE === 'mock') return;
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => toast.error('Failed to load payment gateway');
    document.body.appendChild(script);
  }, []);

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressError(null);

    const { full_address, city, state, pincode } = addressForm;
    if (!full_address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setAddressError('All fields are required');
      return;
    }

    setSavingAddress(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Failed to save address');
      }
      const created = (await res.json()) as Address;
      setAddressForm(emptyAddressForm);
      setShowAddForm(false);
      await loadAddresses();
      if (created?.id) setSelectedAddress(created);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  }

  const mockMode = process.env.NEXT_PUBLIC_PAYMENT_MODE === 'mock';

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    if (
      mode === 'buynow' &&
      buyNowProduct &&
      buyNowProduct.variants.length > 0 &&
      !buyNowVariant
    ) {
      toast.error('Please choose a size before continuing');
      return;
    }
    if (editLines.length === 0) {
      toast.error('No items in your order');
      return;
    }

    // Send the (possibly edited) lines explicitly; the server re-derives prices.
    const payload = {
      addressId: selectedAddress.id,
      source: mode,
      lines: editLines.map((l) => ({
        productId: l.productId,
        variantLabel: l.variantLabel,
        quantity: l.quantity,
      })),
    };

    // MOCK PATH
    if (mockMode) {
      setPlacing(true);
      try {
        const res = await fetch('/api/checkout/mock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Failed to place test order');
        }
        const data = (await res.json()) as { orderId: string };
        router.push(`/order/${data.orderId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
        setPlacing(false);
      }
      return;
    }

    // RAZORPAY PATH
    if (!scriptReady || !window.Razorpay) {
      toast.error('Payment gateway is still loading. Please try again.');
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Failed to start checkout');
      }
      const data = (await res.json()) as {
        razorpayOrderId: string;
        amount: number;
        currency: string;
      };

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error('Payment gateway is not configured');

      const description =
        editLines.length > 1
          ? `${editLines.length} items`
          : editLines[0]?.name ?? 'Order';

      const rzp = new window.Razorpay({
        key: razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: 'TeaKart',
        description,
        order_id: data.razorpayOrderId,
        handler: (response) => {
          router.push(`/order/${response.razorpay_order_id}`);
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast.error('Payment cancelled');
          },
        },
        theme: { color: '#000000' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setPlacing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {mockMode && (
        <div className="rounded-xl border border-warning-ring bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
          <span className="font-semibold">Test mode is on.</span> No real payment
          will be charged. Orders placed here will appear in your account and
          the admin panel exactly as a real order would.
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Order summary
        </h2>
        <ul className="mt-3 space-y-3">
          {editLines.map((line, idx) => (
            <li
              key={`${line.productId}::${line.variantLabel ?? ''}::${idx}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 flex-1 text-foreground">
                <span className="font-medium">{line.name}</span>
                {line.variantLabel && (
                  <span className="text-muted-foreground"> · {line.variantLabel}</span>
                )}
                <span className="block text-xs text-muted-foreground">
                  ₹{line.unitPrice.toLocaleString('en-IN')} each
                </span>
              </span>
              <div className="inline-flex items-center rounded-lg border border-border bg-background">
                <button
                  type="button"
                  onClick={() => setLineQty(idx, line.quantity - 1)}
                  disabled={line.quantity <= 1 || placing}
                  aria-label={`Decrease quantity of ${line.name}`}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <Minus className="size-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={line.quantity}
                  onChange={(e) => setLineQty(idx, parseInt(e.target.value, 10))}
                  disabled={placing}
                  aria-label={`Quantity of ${line.name}`}
                  className="w-10 border-x border-border bg-transparent py-1 text-center text-sm font-medium tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setLineQty(idx, line.quantity + 1)}
                  disabled={line.quantity >= 99 || placing}
                  aria-label={`Increase quantity of ${line.name}`}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <span className="w-20 shrink-0 text-right tabular-nums text-foreground">
                ₹{(line.unitPrice * line.quantity).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            ₹{computedTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </section>

      <section>
        {addressesLoading ? (
          <p className="text-sm text-muted-foreground">Loading saved addresses…</p>
        ) : (
          <AddressSelector
            addresses={addresses}
            selected={selectedAddress}
            onSelect={setSelectedAddress}
            onAddNew={() => setShowAddForm((v) => !v)}
          />
        )}

        {showAddForm && (
          <form
            onSubmit={handleSaveAddress}
            className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground">Address</span>
              <input
                type="text"
                value={addressForm.full_address}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, full_address: e.target.value }))
                }
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="House/flat no., street, area"
                disabled={savingAddress}
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-foreground">City</span>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                  className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  disabled={savingAddress}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-foreground">State</span>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                  className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  disabled={savingAddress}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground">Pincode</span>
              <input
                type="text"
                inputMode="numeric"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm((f) => ({ ...f, pincode: e.target.value }))}
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                disabled={savingAddress}
              />
            </label>

            {addressError && (
              <p className="text-sm text-destructive">{addressError}</p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={savingAddress}>
                {savingAddress ? 'Saving…' : 'Save address'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setAddressError(null);
                }}
                disabled={savingAddress}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      <Button
        type="button"
        size="lg"
        onClick={handlePlaceOrder}
        disabled={placing || !selectedAddress || addressesLoading}
      >
        {placing
          ? 'Processing…'
          : mockMode
            ? `Place test order · ₹${computedTotal.toLocaleString('en-IN')}`
            : `Place order · ₹${computedTotal.toLocaleString('en-IN')}`}
      </Button>
    </div>
  );
}
