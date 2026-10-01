import { Pricing } from '../products/product.mapper';

/** docs/API.md §2.4: unitPrice = product.pricing + Σ selectedOption.priceDelta, floored at 0 per component. */
export function unitPriceWithOptions(pricing: Pricing, totalDelta: number): Pricing {
  if (pricing.type === 'fixed') {
    return { type: 'fixed', amount: Math.max(0, pricing.amount + totalDelta) };
  }
  if (pricing.type === 'range') {
    return {
      type: 'range',
      min: Math.max(0, pricing.min + totalDelta),
      max: Math.max(0, pricing.max + totalDelta),
    };
  }
  return { type: 'on_request' };
}

export interface EstimatedTotal {
  min: number;
  max: number;
}

/** docs/API.md §2.4: null if any item is on_request; fixed counts as min = max. */
export function estimateTotal(items: { unitPrice: Pricing; quantity: number }[]): EstimatedTotal | null {
  if (items.some((item) => item.unitPrice.type === 'on_request')) {
    return null;
  }
  let min = 0;
  let max = 0;
  for (const item of items) {
    if (item.unitPrice.type === 'fixed') {
      min += item.unitPrice.amount * item.quantity;
      max += item.unitPrice.amount * item.quantity;
    } else if (item.unitPrice.type === 'range') {
      min += item.unitPrice.min * item.quantity;
      max += item.unitPrice.max * item.quantity;
    }
  }
  return { min, max };
}
