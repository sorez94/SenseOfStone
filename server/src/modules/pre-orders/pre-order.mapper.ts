import { PreOrder } from '@prisma/client';
import { PRE_ORDER_STATUS_FROM_DB } from './pre-order.enums';

export interface PreOrderDto {
  id: string;
  reference: string;
  status: string;
  customer: unknown;
  items: unknown;
  estimatedTotal: { min: number; max: number } | null;
  currency: string;
  customerNote: string | null;
  adminNote: string | null;
  history: unknown;
  createdAt: string;
  updatedAt: string;
}

/** docs/API.md §2.4: adminNote is internal and must be nulled out on customer-facing endpoints. */
export function toPreOrderDto(preOrder: PreOrder, includeAdminNote: boolean): PreOrderDto {
  return {
    id: preOrder.id,
    reference: preOrder.reference,
    status: PRE_ORDER_STATUS_FROM_DB[preOrder.status],
    customer: preOrder.customerSnapshot,
    items: preOrder.items,
    estimatedTotal:
      preOrder.estimatedTotalMin !== null && preOrder.estimatedTotalMax !== null
        ? { min: preOrder.estimatedTotalMin, max: preOrder.estimatedTotalMax }
        : null,
    currency: preOrder.currency,
    customerNote: preOrder.customerNote,
    adminNote: includeAdminNote ? preOrder.adminNote : null,
    history: preOrder.history,
    createdAt: preOrder.createdAt.toISOString(),
    updatedAt: preOrder.updatedAt.toISOString(),
  };
}
