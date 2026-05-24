'use client'

import { useMemo, useState } from 'react'
import type { Product } from '@/types'
import ProductCard from './product-card'
import SelectMenu from '@/components/ui/select-menu'

const RATING_OPTIONS = [
  { value: 'all', label: 'Any rating' },
  { value: '3', label: '3★ & up' },
  { value: '4', label: '4★ & up' },
]

type SortKey = 'name-asc' | 'price-asc' | 'price-desc' | 'rating-desc' | 'sales-desc'
type RatingFilter = 'all' | '3' | '4'

type RatingMap = Record<string, { average: number; count: number } | undefined>

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Top rated' },
  { value: 'sales-desc', label: 'Best selling' },
]

function byName(a: Product, b: Product) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export default function SortableProductGrid({
  products,
  ratings,
  bestSellerIds,
}: {
  products: Product[]
  ratings?: RatingMap
  /** Product ids to mark with the "Best seller" badge (category top sellers). */
  bestSellerIds?: Set<string>
}) {
  const [sort, setSort] = useState<SortKey>('name-asc')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  // Price has a draft (what's typed) + applied (what filters), committed via Apply.
  const [draftMin, setDraftMin] = useState('')
  const [draftMax, setDraftMax] = useState('')
  const [appliedMin, setAppliedMin] = useState('')
  const [appliedMax, setAppliedMax] = useState('')

  const min = appliedMin.trim() !== '' && Number.isFinite(Number(appliedMin)) ? Number(appliedMin) : null
  const max = appliedMax.trim() !== '' && Number.isFinite(Number(appliedMax)) ? Number(appliedMax) : null
  const priceActive = min !== null || max !== null
  const ratingActive = ratingFilter !== 'all'
  const ratingSort = sort === 'rating-desc'

  const isRated = (p: Product) => (ratings?.[p.id]?.count ?? 0) > 0

  const compare = useMemo(() => {
    const salesOf = (p: Product) => p.sales_count ?? 0
    const ratingOf = (p: Product) => ratings?.[p.id]?.average ?? 0
    return (a: Product, b: Product) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price || byName(a, b)
        case 'price-desc':
          return b.price - a.price || byName(a, b)
        case 'rating-desc':
          return ratingOf(b) - ratingOf(a) || salesOf(b) - salesOf(a) || byName(a, b)
        case 'sales-desc':
          return salesOf(b) - salesOf(a) || byName(a, b)
        default:
          return byName(a, b)
      }
    }
  }, [sort, ratings])

  // Split into products matching the active filters vs the rest (still shown
  // below). In the "others" group, when rating is in play, unrated come first,
  // then rated-but-below-threshold — each subgroup keeps the selected sort.
  const { matched, others } = useMemo(() => {
    const matched: Product[] = []
    const others: Product[] = []
    for (const p of products) {
      const r = ratings?.[p.id]
      const rated = (r?.count ?? 0) > 0
      const avg = r?.average ?? 0
      const passesPrice = (min === null || p.price >= min) && (max === null || p.price <= max)
      const passesRating = ratingFilter === 'all' ? true : rated && avg >= Number(ratingFilter)
      const unratedUnderRatingSort = ratingSort && !rated
      if (passesPrice && passesRating && !unratedUnderRatingSort) matched.push(p)
      else others.push(p)
    }
    matched.sort(compare)
    const ratingContext = ratingActive || ratingSort
    others.sort((a, b) => {
      if (ratingContext) {
        const aRank = isRated(a) ? 1 : 0 // unrated (0) first
        const bRank = isRated(b) ? 1 : 0
        if (aRank !== bRank) return aRank - bRank
      }
      return compare(a, b)
    })
    return { matched, others }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, ratings, min, max, ratingFilter, ratingSort, ratingActive, compare])

  function applyPrice() {
    setAppliedMin(draftMin)
    setAppliedMax(draftMax)
  }

  function clearFilters() {
    setDraftMin('')
    setDraftMax('')
    setAppliedMin('')
    setAppliedMax('')
    setRatingFilter('all')
  }

  // Sub-line explaining why the "others" group is down here.
  const otherReasons: string[] = []
  if (priceActive) otherReasons.push('outside your price range')
  if (ratingActive) otherReasons.push(`not rated ${ratingFilter}★ or higher`)
  if (ratingSort && !ratingActive) otherReasons.push('not rated yet')
  const otherSubtitle =
    otherReasons.length > 0
      ? otherReasons.join(' · ').replace(/^./, (c) => c.toUpperCase())
      : 'Outside your current filters'

  if (products.length === 0) {
    return <div className="py-24 text-center text-muted-foreground">No products found.</div>
  }

  const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4'
  const priceDirty = draftMin !== appliedMin || draftMax !== appliedMax

  return (
    <div className="space-y-6">
      {/* Toolbar: filters (left) + sort (right) */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card py-1 pl-3 pr-1">
            <span className="text-xs font-medium text-muted-foreground">Price&nbsp;₹</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Min"
              value={draftMin}
              onChange={(e) => setDraftMin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
              aria-label="Minimum price"
              className="w-14 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Max"
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
              aria-label="Maximum price"
              className="w-14 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={applyPrice}
              disabled={!priceDirty}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Apply
            </button>
          </div>

          <SelectMenu
            value={ratingFilter}
            options={RATING_OPTIONS}
            onChange={(v) => setRatingFilter(v as RatingFilter)}
            ariaLabel="Filter by rating"
          />

          {(priceActive || ratingActive) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Sort by</span>
          <SelectMenu
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => setSort(v as SortKey)}
            ariaLabel="Sort products"
          />
        </div>
      </div>

      {matched.length > 0 ? (
        <div className={gridClass}>
          {matched.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              rating={ratings?.[product.id]}
              isBestSeller={bestSellerIds?.has(product.id)}
            />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing matches your filters exactly{others.length > 0 ? ' — see the suggestions below.' : '.'}
        </p>
      )}

      {others.length > 0 && (
        <section className="space-y-6 border-t border-border pt-8">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              More to consider
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{otherSubtitle}.</p>
          </div>
          <div className={gridClass}>
            {others.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                rating={ratings?.[product.id]}
                isBestSeller={bestSellerIds?.has(product.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
