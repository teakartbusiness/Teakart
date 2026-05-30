import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import ProductCard from '@/components/products/product-card'
import SearchBar from '@/components/products/search-bar'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { productHref, type HomeData } from './home-types'

function heroUrl(p: Product): string | null {
  return p.images?.[0]?.url ?? null
}

/**
 * Alternative "Discover" homepage — an editorial, image-forward layout:
 *   - a bento hero (headline + search beside a mosaic of real product shots),
 *   - quick category chips,
 *   - a full-width spotlight for the overall best-seller,
 *   - horizontal snap-scroll rails per category instead of static grids.
 * Same data as the classic view; just a more dynamic presentation.
 */
export default function DiscoverHome({ newArrivals, sections, ratings, spotlight, mosaic }: HomeData) {
  const singleSquare = mosaic.length === 1

  return (
    <>
      {/* Bento hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col justify-center rounded-3xl border border-border bg-surface-muted p-8 sm:p-12 lg:col-span-7">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3.5" /> Discover the collection
              </p>
              <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Find something<br />worth keeping.
              </h1>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                Hand-picked goods, straight from the maker. Search what you need,
                or wander the rails below.
              </p>
              <div className="mt-8 max-w-md">
                <SearchBar variant="hero" />
              </div>
              <div className="mt-5">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
                >
                  Browse everything
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {mosaic.length > 0 && (
              <div className="lg:col-span-5">
                {/* Square tiles keep product shots uncropped. One product → a
                    single large square; otherwise a responsive 2×2 grid. */}
                <div className={cn('grid gap-3 sm:gap-4', !singleSquare && 'grid-cols-2')}>
                  {mosaic.map((p, i) => (
                    <Link
                      key={p.id}
                      href={productHref(p)}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition-all hover:ring-border-strong"
                    >
                      <Image
                        src={heroUrl(p) as string}
                        alt={p.name}
                        fill
                        // First hero tile is the likely LCP — load it eagerly +
                        // preload (priority); the rest stay lazy.
                        priority={i === 0}
                        sizes={singleSquare ? '(max-width: 1024px) 100vw, 40vw' : '(max-width: 1024px) 50vw, 20vw'}
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <p className="truncate text-xs font-medium text-background">{p.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category chips */}
      {sections.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-5 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 self-center pr-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Shop
            </span>
            {sections.map(({ category }) => (
              <Link
                key={category.id}
                href={`/products/${category.slug}`}
                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-muted"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Spotlight band — overall best-seller */}
      {spotlight && heroUrl(spotlight) && (
        <section className="border-b border-border bg-surface-sunken">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
            <Link
              href={productHref(spotlight)}
              className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted ring-1 ring-border"
            >
              <Image
                src={heroUrl(spotlight) as string}
                alt={spotlight.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 rounded-2xl bg-warning px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning-foreground shadow-sm">
                Best seller
              </span>
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Spotlight
              </p>
              {spotlight.category && (
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {spotlight.category.name}
                </p>
              )}
              <h2 className="mt-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {spotlight.name}
              </h2>
              {spotlight.description && (
                <p className="mt-4 max-w-md text-muted-foreground line-clamp-3">{spotlight.description}</p>
              )}
              <p className="mt-5 text-2xl font-semibold tabular-nums text-foreground">
                ₹{spotlight.price.toLocaleString('en-IN')}
              </p>
              <Link
                href={productHref(spotlight)}
                className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                Shop now
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New arrivals rail */}
      {newArrivals.length > 0 && (
        <Rail
          eyebrow="New arrivals"
          title="Fresh in this week"
          href="/products"
          linkLabel="View all →"
          products={newArrivals}
          ratings={ratings}
        />
      )}

      {/* Per-category rails */}
      {sections.map(({ category, products, total, bestSellerId }) => (
        <Rail
          key={category.id}
          eyebrow="Category"
          title={category.name}
          href={`/products/${category.slug}`}
          linkLabel={total > products.length ? `See all ${total} →` : 'View category →'}
          products={products}
          ratings={ratings}
          bestSellerId={bestSellerId}
        />
      ))}
    </>
  )
}

/** A horizontal, snap-scrolling product rail. */
function Rail({
  eyebrow,
  title,
  href,
  linkLabel,
  products,
  ratings,
  bestSellerId,
}: {
  eyebrow: string
  title: string
  href: string
  linkLabel: string
  products: Product[]
  ratings: HomeData['ratings']
  bestSellerId?: string | null
}) {
  return (
    <section className="border-b border-border last:border-b-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-1 sm:gap-x-16">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <Link
              href={href}
              aria-label={`${linkLabel} — ${title}`}
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {linkLabel}
            </Link>
          </div>
        </div>

        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[44vw] shrink-0 snap-start sm:w-[230px] lg:w-[250px]"
            >
              <ProductCard
                product={product}
                rating={ratings.get(product.id)}
                isBestSeller={product.id === bestSellerId}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
