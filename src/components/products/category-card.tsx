import Image from 'next/image'
import Link from 'next/link'
import type { Category } from '@/types'

/**
 * Category tile for the /products landing. Cover image (admin-selected, or the
 * first product's hero) on top, name + count below — theme-token styled.
 */
export default function CategoryCard({
  category,
  coverUrl,
  productCount,
}: {
  category: Category
  coverUrl: string | null
  productCount: number
}) {
  return (
    <Link
      href={`/products/${category.slug}`}
      className="group block transition-transform duration-150 ease-out focus-visible:outline-none active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition-all duration-300 group-hover:ring-border-strong group-focus-visible:ring-2 group-focus-visible:ring-ring">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-text-subtle">
            No image
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-display text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-muted-foreground">
          {category.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {productCount} {productCount === 1 ? 'piece' : 'pieces'}
        </p>
      </div>
    </Link>
  )
}
