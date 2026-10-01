import { PreOrderStatus } from '@prisma/client';
import { canTransition } from './pre-order.enums';

describe('canTransition (docs/API.md §2.4 status machine)', () => {
  it.each([
    [PreOrderStatus.PENDING, PreOrderStatus.CONFIRMED, true],
    [PreOrderStatus.PENDING, PreOrderStatus.REJECTED, true],
    [PreOrderStatus.PENDING, PreOrderStatus.CANCELLED, true],
    [PreOrderStatus.PENDING, PreOrderStatus.COMPLETED, false],
    [PreOrderStatus.CONFIRMED, PreOrderStatus.COMPLETED, true],
    [PreOrderStatus.CONFIRMED, PreOrderStatus.CANCELLED, true],
    [PreOrderStatus.CONFIRMED, PreOrderStatus.PENDING, false],
    [PreOrderStatus.CONFIRMED, PreOrderStatus.REJECTED, false],
    [PreOrderStatus.REJECTED, PreOrderStatus.PENDING, false],
    [PreOrderStatus.CANCELLED, PreOrderStatus.CONFIRMED, false],
    [PreOrderStatus.COMPLETED, PreOrderStatus.CANCELLED, false],
  ])('from %s to %s -> %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});
