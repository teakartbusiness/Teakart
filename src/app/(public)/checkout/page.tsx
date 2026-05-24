import { notFound, redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import type { CartLine, Product, Variant } from '@/types';

type Props = {
  searchParams: Promise<{ productId?: string; variantLabel?: string; quantity?: string; source?: string }>;
};

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

type CheckoutLineSummary = {
  productId: string;
  name: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/checkout');
  }

  const { productId, variantLabel, quantity: quantityParam, source } = await searchParams;
  const mode: 'cart' | 'buynow' = source === 'cart' ? 'cart' : 'buynow';
  const buyNowQty = Math.min(99, Math.max(1, parseInt(quantityParam ?? '1', 10) || 1));

  let lines: CheckoutLineSummary[] = [];
  let total = 0;
  let buyNowProduct: Product | null = null;
  let buyNowVariant: Variant | null = null;

  if (mode === 'cart') {
    const { data: row } = await supabase
      .from('users')
      .select('cart')
      .eq('id', user.id)
      .single();
    const stored = (row?.cart ?? []) as CartLine[];
    if (stored.length === 0) redirect('/cart');

    const productIds = Array.from(new Set(stored.map((l) => l.product_id)));
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, variants, in_stock, is_deleted')
      .in('id', productIds);
    const byId = new Map((products ?? []).filter((p) => !p.is_deleted).map((p) => [p.id as string, p]));

    for (const l of stored) {
      const product = byId.get(l.product_id);
      if (!product) continue;
      const variants = (product.variants ?? []) as Variant[];
      let unit = product.price;
      let vLabel: string | null = null;
      if (variants.length > 0 && l.variant_label) {
        const v = variants.find((vv) => vv.label === l.variant_label);
        if (v) {
          unit = v.price;
          vLabel = v.label;
        }
      }
      lines.push({
        productId: product.id as string,
        name: product.name as string,
        variantLabel: vLabel ?? (typeof l.variant_label === 'string' ? l.variant_label : null),
        quantity: l.quantity,
        unitPrice: unit,
      });
      total += unit * l.quantity;
    }

    if (lines.length === 0) redirect('/cart');
  } else {
    if (!productId) notFound();
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (!product) notFound();
    buyNowProduct = product as Product;
    const preselected = variantLabel
      ? buyNowProduct.variants.find((v) => v.label === variantLabel) ?? null
      : null;
    buyNowVariant = preselected;
    const unit = preselected?.price ?? buyNowProduct.price;
    lines = [{
      productId: buyNowProduct.id,
      name: buyNowProduct.name,
      variantLabel: preselected?.label ?? null,
      quantity: buyNowQty,
      unitPrice: unit,
    }];
    total = unit * buyNowQty;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Review your order and choose a delivery address.
        </p>
      </div>

      <div className="mt-10">
        <CheckoutForm
          mode={mode}
          lines={lines}
          total={total}
          buyNowProduct={buyNowProduct}
          buyNowVariant={buyNowVariant}
        />
      </div>
    </main>
  );
}
