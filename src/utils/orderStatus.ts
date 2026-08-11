import type { Order, OrderAllowedAction, OrderSettlementStatus } from '../types/api'

export type OrderBadgeTone = 'neutral' | 'accent' | 'danger' | 'success' | 'warning'

/** Subset of `frontend/src/utils/orderStatus.ts` covering the buyer-facing labels used on mobile. */
export function orderTitle(order: Pick<Order, 'items'>) {
  if (order.items.length > 1) return `${order.items[0]?.title || 'Order item'} + ${order.items.length - 1} more`
  return order.items[0]?.title || 'Order item'
}

export function isOrderUnderReview(order: Pick<Order, 'workflow' | 'activeReportId' | 'status'>) {
  return Boolean(order.workflow?.report?.active || order.activeReportId || order.status === 'disputed')
}

export function deliveryMethodLabel(method?: NonNullable<Order['delivery']>['method']) {
  switch (method) {
    case 'shop_pickup':
      return 'Shop pickup'
    case 'station_pickup':
      return 'Station pickup'
    default:
      return 'Delivery'
  }
}

/**
 * The delivery fee in pesewas, resolved from wherever it was recorded — a
 * checkout-time snapshot, or the transit amount the seller entered while
 * dispatching a station-pickup order (web-only; sellers dispatch from the web
 * app). `null` means genuinely unknown yet; `0` means no fee applies. Render
 * `null` as "TBD" and `0` as "Free" (or hide the row) — never guess a fee from
 * the method alone.
 */
export function orderDeliveryFee(order: Pick<Order, 'delivery' | 'deliveryFee'>): number | null {
  const known = order.deliveryFee || order.delivery?.fee || order.delivery?.transit?.amount
  if (known) return known
  return order.delivery?.method === 'station_pickup' ? null : 0
}

export function orderAddress(order: Pick<Order, 'delivery'>) {
  const destination = order.delivery?.destination
  if (destination) {
    return [destination.preferredTerminal, destination.town, destination.region].filter(Boolean).join(', ')
  }
  const address = order.delivery?.address
  return [address?.street, address?.city, address?.region].filter(Boolean).join(', ')
}

export function orderProgressLabel(order: Order) {
  if (isOrderUnderReview(order)) return 'Funds frozen — under review'

  switch (order.fulfillmentStatus) {
    case 'awaiting_seller':
      return 'Waiting for seller'
    case 'ready_for_pickup':
      return 'Ready for pickup'
    case 'in_transit':
      return 'On the way'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      if (order.settlementStatus === 'refund_pending') return 'Refund started'
      if (order.settlementStatus === 'refund_attention') return 'Refund needs attention'
      if (order.settlementStatus === 'refund_failed') return 'Refund failed'
      if (order.settlementStatus === 'refunded') return 'Refunded'
      return 'Cancelled'
    default:
      break
  }

  // Legacy orders predating the lifecycle migration still carry only the flat `status`.
  if (order.status === 'delivered') return 'Completed'
  if (order.status === 'cancelled') return 'Cancelled'
  if (order.status === 'refunded') return 'Refunded'
  if (order.status === 'disputed') return 'Funds frozen — under review'
  if (order.delivery?.method === 'shop_pickup' && order.sellerAction === 'pickup_ready') return 'Ready for pickup'
  if (order.status === 'shipped') return 'On the way'
  if (order.status === 'processing') return 'Preparing order'
  if (order.status === 'paid') return 'Payment protected'
  return 'Order placed'
}

export function orderStatusTone(order: Order): OrderBadgeTone {
  if (isOrderUnderReview(order) || order.settlementStatus === 'refund_failed' || order.settlementStatus === 'refund_attention') {
    return 'danger'
  }
  if (order.fulfillmentStatus === 'completed' || ['released', 'cash_collected'].includes(order.settlementStatus || '')) {
    return 'success'
  }
  if (order.fulfillmentStatus === 'cancelled' || order.settlementStatus === 'refunded') return 'neutral'
  if (order.fulfillmentStatus === 'ready_for_pickup' || order.settlementStatus === 'refund_pending') return 'warning'
  return 'accent'
}

export function orderSettlementLabel(status: Order['settlementStatus'], paymentMethod?: Order['paymentMethod']) {
  if (!status) {
    return paymentMethod === 'cash_on_pickup' ? 'Cash due at pickup' : 'Payment status pending'
  }
  const labels: Record<OrderSettlementStatus, string> = {
    payment_pending: 'Payment pending',
    cash_due: 'Cash due at pickup',
    cash_collected: 'Cash collected',
    held: 'Protected in escrow',
    released: 'Released to seller',
    refund_pending: 'Refund in progress',
    refund_attention: 'Refund needs attention',
    refunded: 'Refunded to buyer',
    refund_failed: 'Refund failed',
    void: 'No payment due',
  }
  return labels[status]
}

/** Buyer-side actions the mobile app can complete without file uploads or a dispute form. */
const buyerActionLabels: Partial<Record<OrderAllowedAction, string>> = {
  cancel_cash_pickup: 'Cancel pickup',
  confirm_collection: 'Confirm collection',
  confirm_receipt: 'Confirm receipt',
  close_no_action: 'Close order',
}

/** Endpoint segment for `POST /orders/:id/actions/:segment`, matching the web `orderActions` map. */
const actionEndpoints: Partial<Record<OrderAllowedAction, string>> = {
  cancel_cash_pickup: 'cancel-cash-pickup',
  confirm_collection: 'confirm-collection',
  confirm_receipt: 'confirm-receipt',
  close_no_action: 'close-no-action',
}

export function buyerOrderActions(order: Order) {
  const allowed = (order.workflow?.allowedActions || []) as OrderAllowedAction[]
  return allowed
    .filter((action) => buyerActionLabels[action] && actionEndpoints[action])
    .map((action) => ({ action, endpoint: actionEndpoints[action] as string, label: buyerActionLabels[action] as string }))
}
