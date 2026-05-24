"use client"

import * as React from "react"
import { Dialog as RadixDialog } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = RadixDialog.Root
const DialogTrigger = RadixDialog.Trigger
const DialogClose = RadixDialog.Close
const DialogPortal = RadixDialog.Portal

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  size = "default",
  ...props
}: React.ComponentProps<typeof RadixDialog.Content> & {
  size?: "default" | "lg" | "xl"
}) {
  const widthClass =
    size === "xl"
      ? "max-w-3xl"
      : size === "lg"
        ? "max-w-2xl"
        : "max-w-md"

  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-0",
          "max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "mx-4",
          widthClass,
          className,
        )}
        {...props}
      >
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          {children}
        </div>
        <RadixDialog.Close
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-b border-border px-6 py-5 pr-12",
        className,
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border bg-surface-muted px-6 py-4",
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn("font-display text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
}
