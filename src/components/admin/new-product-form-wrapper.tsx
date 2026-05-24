'use client'

import { useRouter } from 'next/navigation'
import ProductForm from './product-form'
import type { Category, Product } from '@/types'

interface Props {
  product?: Product
  categories: Category[]
}

export default function NewProductFormWrapper({ product, categories }: Props) {
  const router = useRouter()

  return (
    <ProductForm
      product={product}
      categories={categories}
      onSuccess={() => router.push('/admin/products')}
    />
  )
}
