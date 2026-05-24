'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import ProductForm from './product-form'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
}

export default function AddProductDialog({ categories }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // Force ProductForm to remount when the dialog closes so the next "Add"
  // starts with empty fields.
  const [formKey, setFormKey] = useState(0)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setFormKey((k) => k + 1)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add product
        </button>
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>New product</DialogTitle>
          <DialogDescription>
            Add a new product to the storefront. You can edit images, variants
            and details after creating it.
          </DialogDescription>
        </DialogHeader>
        {/* py-4 (vs default py-5) — the product form is long and the dialog
            was just barely overflowing the viewport at common sizes. */}
        <DialogBody className="py-4">
          <ProductForm
            key={formKey}
            categories={categories}
            onSuccess={() => {
              handleOpenChange(false)
              router.refresh()
            }}
            renderActionsInline={false}
          />
        </DialogBody>
        <DialogFooter>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create product
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
