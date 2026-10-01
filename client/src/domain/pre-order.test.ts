import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canCustomerCancel,
  canTransition,
  estimateTotal,
  resolveSelectedOptions,
  unitPriceWithOptions,
} from "./pre-order";
import type { ProductOption } from "./product";

const options: ProductOption[] = [
  {
    id: "size",
    name: { en: "Size" },
    required: true,
    values: [
      { id: "s", label: { en: "S" }, priceDelta: -100 },
      { id: "l", label: { en: "L" }, priceDelta: 500 },
    ],
  },
  { id: "gift", name: { en: "Gift wrap" }, required: false, values: [{ id: "yes", label: { en: "Yes" }, priceDelta: 50 }] },
];

describe("pre-order status transitions", () => {
  it("allows the documented transitions only", () => {
    expect(allowedNextStatuses("pending")).toEqual(["confirmed", "rejected", "cancelled"]);
    expect(canTransition("confirmed", "completed")).toBe(true);
    expect(canTransition("pending", "completed")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(allowedNextStatuses("rejected")).toHaveLength(0);
  });

  it("lets customers cancel only pending requests", () => {
    expect(canCustomerCancel({ status: "pending" })).toBe(true);
    expect(canCustomerCancel({ status: "confirmed" })).toBe(false);
  });
});

describe("resolveSelectedOptions", () => {
  it("resolves valid selections", () => {
    const result = resolveSelectedOptions({ options }, { size: "l" });
    expect(result.ok && result.options.map((o) => o.valueId)).toEqual(["l"]);
  });

  it("reports missing required and invalid options", () => {
    expect(resolveSelectedOptions({ options }, {})).toEqual({ ok: false, missingOptionIds: ["size"], invalidOptionIds: [] });
    expect(resolveSelectedOptions({ options }, { size: "xl", color: "red" })).toEqual({
      ok: false,
      missingOptionIds: [],
      invalidOptionIds: ["size", "color"],
    });
  });
});

describe("pricing", () => {
  it("applies option deltas without going negative", () => {
    expect(unitPriceWithOptions({ type: "fixed", amount: 1000 }, [{ priceDelta: 500 }, { priceDelta: 50 }])).toEqual({ type: "fixed", amount: 1550 });
    expect(unitPriceWithOptions({ type: "fixed", amount: 50 }, [{ priceDelta: -100 }])).toEqual({ type: "fixed", amount: 0 });
    expect(unitPriceWithOptions({ type: "range", min: 100, max: 200 }, [{ priceDelta: 10 }])).toEqual({ type: "range", min: 110, max: 210 });
  });

  it("estimates totals and returns null for on-request items", () => {
    expect(
      estimateTotal([
        { unitPrice: { type: "fixed", amount: 100 }, quantity: 2 },
        { unitPrice: { type: "range", min: 10, max: 20 }, quantity: 3 },
      ]),
    ).toEqual({ min: 230, max: 260 });
    expect(estimateTotal([{ unitPrice: { type: "on_request" }, quantity: 1 }])).toBeNull();
  });
});
