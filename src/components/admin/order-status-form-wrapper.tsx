'use client'

import { useRouter } from 'next/navigation'
import OrderStatusForm from './order-status-form'
import type { OrderStatus } from '@/types'

interface Props {
  orderId: string
  currentStatus: OrderStatus
  currentEstimatedDelivery?: string | null
}

export default function OrderStatusFormWrapper({
  orderId,
  currentStatus,
  currentEstimatedDelivery,
}: Props) {
  const router = useRouter()

  return (
    <OrderStatusForm
      orderId={orderId}
      currentStatus={currentStatus}
      currentEstimatedDelivery={currentEstimatedDelivery}
      onSuccess={() => router.refresh()}
    />
  )
}
