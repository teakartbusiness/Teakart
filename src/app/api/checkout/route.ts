import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { CartLine, Variant } from '@/types';

const MAX_CART_ITEMS = 20;

type IncomingLine = { productId?: string; variantLabel?: string | null; quantity?: number };

type ResolvedLine = {
  productId: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 5 checkouts per user / IP per minute is generous for real shoppers and
  // tight enough to discourage abuse / accidental loops.
  const rl = await checkRateLimit(request, { name: 'checkout', requests: 5, window: '1 m' }, user.id);
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  let body: {
    productId?: string;
    selectedSize?: string;
    quantity?: number;
    addressId?: string;
    lines?: IncomingLine[];
    source?: 'cart' | 'buynow';
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { addressId, source } = body;
  if (!addressId) {
    return NextResponse.json({ error: 'Missing addressId' }, { status: 400 });
  }

  // Verify the address belongs to the user.
  const { data: address } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!address) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  // Normalize input into a canonical line list. Explicit lines (e.g. quantities
  // edited on the checkout page) win; prices are always re-derived server-side
  // below, so a client can't spoof what it pays.
  let rawLines: IncomingLine[];
  if (Array.isArray(body.lines) && body.lines.length > 0) {
    rawLines = body.lines;
  } else if (source === 'cart') {
    // Fallback: re-read the cart server-side.
    const { data: userRow } = await supabase
      .from('users')
      .select('cart')
      .eq('id', user.id)
      .single();
    const stored = ((userRow?.cart ?? []) as CartLine[]).filter(
      (l) => l && typeof l.product_id === 'string' && typeof l.quantity === 'number' && l.quantity > 0,
    );
    if (stored.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }
    rawLines = stored.map((l) => ({
      productId: l.product_id,
      variantLabel: l.variant_label,
      quantity: l.quantity,
    }));
  } else if (body.productId) {
    const q = typeof body.quantity === 'number' && body.quantity > 0 ? Math.floor(body.quantity) : 1;
    rawLines = [{
      productId: body.productId,
      variantLabel: body.selectedSize ?? null,
      quantity: q,
    }];
  } else {
    return NextResponse.json({ error: 'No items in checkout request' }, { status: 400 });
  }

  if (rawLines.length > MAX_CART_ITEMS) {
    return NextResponse.json(
      { error: `Cart has too many items (max ${MAX_CART_ITEMS}).` },
      { status: 400 },
    );
  }

  // Server-side price derivation per line.
  const productIds = Array.from(new Set(
    rawLines
      .map((l) => l.productId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  ));

  const { data: productRows } = await supabase
    .from('products')
    .select('id, price, variants, in_stock, is_deleted')
    .in('id', productIds);

  const productById = new Map(
    (productRows ?? []).filter((p) => !p.is_deleted).map((p) => [p.id as string, p]),
  );

  const resolved: ResolvedLine[] = [];
  for (const line of rawLines) {
    if (!line.productId) {
      return NextResponse.json({ error: 'Missing productId on a line' }, { status: 400 });
    }
    const product = productById.get(line.productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found or no longer available' }, { status: 404 });
    }
    if (product.in_stock === false) {
      return NextResponse.json({ error: 'A product is out of stock' }, { status: 400 });
    }

    const variants = (product.variants ?? []) as Variant[];
    const requestedVariant = line.variantLabel && line.variantLabel !== 'default' && line.variantLabel !== ''
      ? line.variantLabel
      : null;
    let unitPrice: number;
    let variantLabel: string | null = null;
    if (variants.length > 0) {
      if (!requestedVariant) {
        return NextResponse.json({ error: 'Variant required for one of the items' }, { status: 400 });
      }
      const v = variants.find((vv) => vv.label === requestedVariant);
      if (!v) {
        return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
      }
      unitPrice = v.price;
      variantLabel = v.label;
    } else {
      unitPrice = product.price;
    }
    if (typeof unitPrice !== 'number' || unitPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 500 });
    }

    const qty = typeof line.quantity === 'number' && line.quantity > 0
      ? Math.floor(line.quantity)
      : 1;

    resolved.push({ productId: line.productId, variantLabel, quantity: qty, unitPrice });
  }

  const totalRupees = resolved.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  if (totalRupees <= 0) {
    return NextResponse.json({ error: 'Total must be greater than zero' }, { status: 400 });
  }

  // Stash compact line data in Razorpay notes — the webhook decodes this to
  // write order_items. Keeping the field names short keeps us comfortably
  // under Razorpay's per-field length cap.
  const compactLines = resolved.map((l) => ({
    p: l.productId,
    v: l.variantLabel,
    q: l.quantity,
    u: l.unitPrice,
  }));

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalRupees * 100),
      currency: 'INR',
      notes: {
        user_id: user.id,
        address_id: addressId,
        lines: JSON.stringify(compactLines),
        source: source ?? (resolved.length > 1 ? 'cart' : 'buynow'),
      },
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      total: totalRupees,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create Razorpay order';
    console.error('[api/checkout] razorpay.orders.create failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

