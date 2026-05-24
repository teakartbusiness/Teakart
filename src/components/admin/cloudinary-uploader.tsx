'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/types'

interface Props {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

export default function CloudinaryUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const dragIndex = useRef<number | null>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    const nextPosition = images.length

    const uploaded: ProductImage[] = []
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('file', files[i])

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) continue

      const { url, public_id } = await res.json() as { url: string; public_id: string }
      uploaded.push({ url, public_id, position: nextPosition + uploaded.length })
    }

    onChange([...images, ...uploaded])
    setUploading(false)
  }

  async function handleDelete(public_id: string) {
    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id }),
    })
    const updated = images
      .filter((img) => img.public_id !== public_id)
      .map((img, i) => ({ ...img, position: i }))
    onChange(updated)
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return

    const reordered = [...images]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(index, 0, moved)
    dragIndex.current = index
    onChange(reordered.map((img, i) => ({ ...img, position: i })))
  }

  function handleDragEnd() {
    dragIndex.current = null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium bg-muted hover:bg-border disabled:opacity-50 rounded-md border border-input transition-colors"
        >
          {uploading ? 'Uploading…' : 'Upload Images'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''} — drag to reorder</span>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[...images]
            .sort((a, b) => a.position - b.position)
            .map((img, index) => (
              <div
                key={img.public_id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="relative group w-24 h-24 rounded-md overflow-hidden border border-border cursor-grab active:cursor-grabbing"
              >
                <Image
                  src={img.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 text-[10px] bg-primary/60 text-primary-foreground px-1 rounded">
                    Hero
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.public_id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
