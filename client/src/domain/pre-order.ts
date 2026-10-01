import type { CurrencyCode, IsoDateTime, LocalizedText, PageQuery } from "./common";
import type { Pricing, Product } from "./product";
import type { Address } from "./user";

export const preOrderStatuses = ["pending", "confirmed", "rejected", "cancelled", "completed"] as const;
export type PreOrderStatus = (typeof preOrderStatuses)[number];

export interface SelectedOption {
  optionId: string;
  valueId: string;
  optionName: LocalizedText;
  valueLabel: LocalizedText;
  priceDelta: number;
}

export interface PreOrderItem {
  id: string;
  productId: string;
  productSlug: string;
  productTitle: LocalizedText;
  productImageUrl: string | null;
  quantity: number;
  selectedOptions: SelectedOption[];
  /** Unit price snapshot (including option deltas) at submission time. */
  unitPrice: Pricing;
}

/** Customer contact details copied from the profile when the pre-order is created. */
export interface CustomerSnapshot {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: Address;
}

export interface PreOrderStatusChange {
  status: PreOrderStatus;
  changedAt: IsoDateTime;
  changedBy: "customer" | "admin" | "system";
  note: string | null;
}

export interface EstimatedTotal {
  min: number;
  max: number;
}

export interface PreOrder {
  id: string;
  /** Human-friendly reference, e.g. "PO-2026-00012". */
  reference: string;
  status: PreOrderStatus;
  customer: CustomerSnapshot;
  items: PreOrderItem[];
  /** Null when at least one item is "price on request". */
  estimatedTotal: EstimatedTotal | null;
  currency: CurrencyCode;
  customerNote: string | null;
  adminNote: string | null;
  history: PreOrderStatusChange[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CreatePreOrderItemInput {
  productId: string;
  quantity: number;
  /** optionId -> valueId */
  options: Record<string, string>;
}

export interface CreatePreOrderInput {
  items: CreatePreOrderItemInput[];
  customerNote?: string;
}

export interface PreOrderListQuery extends PageQuery {
  status?: PreOrderStatus;
}

export interface AdminPreOrderListQuery extends PreOrderListQuery {
  q?: string;
  productId?: string;
}

export interface UpdatePreOrderStatusInput {
  status: PreOrderStatus;
  note?: string;
}

export interface UpdatePreOrderNoteInput {
  adminNote: string | null;
}

/** Allowed status transitions. Terminal statuses have none. */
const transitions: Record<PreOrderStatus, readonly PreOrderStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["completed", "cancelled"],
  rejected: [],
  cancelled: [],
  completed: [],
};

export function allowedNextStatuses(status: PreOrderStatus): readonly PreOrderStatus[] {
  return transitions[status];
}

export function canTransition(from: PreOrderStatus, to: PreOrderStatus): boolean {
  return transitions[from].includes(to);
}

/** Customers may cancel only while the request is still pending. */
export function canCustomerCancel(preOrder: Pick<PreOrder, "status">): boolean {
  return preOrder.status === "pending";
}

export type OptionSelectionResult =
  | { ok: true; options: SelectedOption[] }
  | { ok: false; missingOptionIds: string[]; invalidOptionIds: string[] };

/** Resolves selected option values and validates them against the product definition. */
export function resolveSelectedOptions(
  product: Pick<Product, "options">,
  selection: Record<string, string>,
): OptionSelectionResult {
  const options: SelectedOption[] = [];
  const missingOptionIds: string[] = [];
  const invalidOptionIds: string[] = [];

  for (const option of product.options) {
    const valueId = selection[option.id];
    if (!valueId) {
      if (option.required) missingOptionIds.push(option.id);
      continue;
    }
    const value = option.values.find((v) => v.id === valueId);
    if (!value) {
      invalidOptionIds.push(option.id);
      continue;
    }
    options.push({
      optionId: option.id,
      valueId: value.id,
      optionName: option.name,
      valueLabel: value.label,
      priceDelta: value.priceDelta,
    });
  }
  for (const optionId of Object.keys(selection)) {
    if (!product.options.some((o) => o.id === optionId)) invalidOptionIds.push(optionId);
  }

  return missingOptionIds.length || invalidOptionIds.length
    ? { ok: false, missingOptionIds, invalidOptionIds }
    : { ok: true, options };
}

/** Unit price after applying option price deltas. */
export function unitPriceWithOptions(pricing: Pricing, options: Pick<SelectedOption, "priceDelta">[]): Pricing {
  const delta = options.reduce((sum, o) => sum + o.priceDelta, 0);
  switch (pricing.type) {
    case "fixed":
      return { type: "fixed", amount: Math.max(0, pricing.amount + delta) };
    case "range":
      return { type: "range", min: Math.max(0, pricing.min + delta), max: Math.max(0, pricing.max + delta) };
    case "on_request":
      return pricing;
  }
}

/** Estimated total for a set of items; null if any item is "price on request". */
export function estimateTotal(items: Pick<PreOrderItem, "unitPrice" | "quantity">[]): EstimatedTotal | null {
  let min = 0;
  let max = 0;
  for (const { unitPrice, quantity } of items) {
    if (unitPrice.type === "on_request") return null;
    min += (unitPrice.type === "fixed" ? unitPrice.amount : unitPrice.min) * quantity;
    max += (unitPrice.type === "fixed" ? unitPrice.amount : unitPrice.max) * quantity;
  }
  return { min, max };
}
