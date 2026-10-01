import { PreOrderStatus } from '@prisma/client';

export const PRE_ORDER_STATUS_TO_DB: Record<string, PreOrderStatus> = {
  pending: PreOrderStatus.PENDING,
  confirmed: PreOrderStatus.CONFIRMED,
  rejected: PreOrderStatus.REJECTED,
  cancelled: PreOrderStatus.CANCELLED,
  completed: PreOrderStatus.COMPLETED,
};
export const PRE_ORDER_STATUS_FROM_DB: Record<PreOrderStatus, string> = {
  [PreOrderStatus.PENDING]: 'pending',
  [PreOrderStatus.CONFIRMED]: 'confirmed',
  [PreOrderStatus.REJECTED]: 'rejected',
  [PreOrderStatus.CANCELLED]: 'cancelled',
  [PreOrderStatus.COMPLETED]: 'completed',
};
export const PRE_ORDER_STATUSES = Object.keys(PRE_ORDER_STATUS_TO_DB);

/** docs/API.md §2.4 status machine. */
export const ALLOWED_TRANSITIONS: Record<PreOrderStatus, PreOrderStatus[]> = {
  [PreOrderStatus.PENDING]: [PreOrderStatus.CONFIRMED, PreOrderStatus.REJECTED, PreOrderStatus.CANCELLED],
  [PreOrderStatus.CONFIRMED]: [PreOrderStatus.COMPLETED, PreOrderStatus.CANCELLED],
  [PreOrderStatus.REJECTED]: [],
  [PreOrderStatus.CANCELLED]: [],
  [PreOrderStatus.COMPLETED]: [],
};

export function canTransition(from: PreOrderStatus, to: PreOrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
