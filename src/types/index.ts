export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type ProductImage = {
  url: string
  public_id: string
  position: number
}

export type Variant = {
  label: string
  price: number
  position: number
}

export type AttributeEntry = {
  key: string
  value: string
  position: number
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  /** Admin-selected product whose hero image is the category cover. Null = use the first product's hero. */
  cover_product_id: string | null
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  category_id: string
  category?: Category
  variants: Variant[]
  images: ProductImage[]
  attributes: AttributeEntry[]
  /** Running total of units sold; powers best-selling sort + "Best seller" badge. */
  sales_count: number
  /** Admin-set highlight flag ("Seller's choice"). */
  is_sellers_choice: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type Address = {
  id: string
  user_id: string
  full_address: string
  city: string
  state: string
  pincode: string
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
}

export type Order = {
  id: string
  user_id: string
  address_id: string
  amount_paid: number
  status: OrderStatus
  payment_status: PaymentStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_fee_paise: number | null
  /** Optional seller-set estimated delivery date (YYYY-MM-DD). Shown to customer only when set. */
  estimated_delivery_date: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  variant_label: string | null
  unit_price: number
  quantity: number
  created_at: string
  product?: Pick<Product, 'name' | 'slug' | 'images'> & {
    category?: Pick<Category, 'slug'> | null
  }
}

export type OrderStatusHistory = {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_at: string
}

/** Customer cart line — stored as JSONB on users.cart. */
export type CartLine = {
  product_id: string
  variant_label: string | null
  quantity: number
}

/** Wishlist row — stored as JSONB on users.wishlist. */
export type WishlistEntry = {
  product_id: string
}

/* ----- Reviews ----- */

export type ReviewSettings = {
  id: 1
  max_images_per_review: number
  updated_at: string
}

export type ProductReview = {
  id: string
  product_id: string
  user_id: string
  order_item_id: string
  rating: number
  body: string | null
  image_urls: string[]
  is_hidden: boolean
  created_at: string
  updated_at: string
  user?: { full_name: string | null } | null
}

// --- Capabilities (admin access control) -------------------------------------

/**
 * Admin capabilities. This single-admin build grants every capability to the
 * env NEXT_PUBLIC_ADMIN_EMAIL ("CEO") and none to anyone else (see lib/auth/capabilities.ts).
 * The list is retained so admin page guards stay declarative and a multi-role
 * UI can be reintroduced later without rewiring them.
 */
export type Capability =
  | 'dashboard.view'
  | 'products.manage'
  | 'categories.manage'
  | 'orders.view'
  | 'orders.update_status'
  | 'reviews.moderate'
  | 'reviews.settings'
  | 'theme.edit'

/** Flat list of every capability key. */
export const ALL_CAPABILITIES: Capability[] = [
  'dashboard.view',
  'products.manage',
  'categories.manage',
  'orders.view',
  'orders.update_status',
  'reviews.moderate',
  'reviews.settings',
  'theme.edit',
]
