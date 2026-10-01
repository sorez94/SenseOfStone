import { describe, expect, it } from "vitest";
import { createSeedDatabase } from "@/mocks/db/seed";
import { resolveProduct } from "@/mocks/server/handlers/shared";
import { createProductFormSchema, emptyProductFormValues, formValuesToInput, productToFormValues, slugify } from "./product-form-model";

const t = (key: string) => key;
const schema = createProductFormSchema(t);

describe("product form model", () => {
  it("round-trips a product through the form without losing data", () => {
    const db = createSeedDatabase();
    const product = resolveProduct(db, db.products.find((p) => p.id === "prd_nature_dining")!);
    const input = formValuesToInput(schema.parse(productToFormValues(product)));

    expect(input.pricing).toEqual(product.pricing);
    expect(input.options).toEqual(product.options);
    expect(input.images.map((i) => i.url)).toEqual(product.images.map((i) => i.url));
    expect(input.categoryId).toBe(product.category.id);
    expect(input.tags).toEqual(product.tags);
    expect(input.preOrder).toEqual(product.preOrder);
  });

  it("validates pricing by type and quantity bounds", () => {
    const base = { ...emptyProductFormValues(), slug: "x", sku: "X", categoryId: "c", title: { en: "X", fa: "" }, shortDescription: { en: "X", fa: "" }, description: { en: "X", fa: "" }, material: { en: "X", fa: "" } };
    const range = schema.safeParse({ ...base, pricingType: "range", min: 10, max: 5 });
    expect(range.success).toBe(false);
    expect(range.error?.issues.map((i) => i.path.join("."))).toContain("max");

    const fixed = schema.safeParse({ ...base, pricingType: "fixed", amount: null });
    expect(fixed.error?.issues.map((i) => i.path.join("."))).toContain("amount");

    const qty = schema.safeParse({ ...base, amount: 1, minQuantity: 5, maxQuantity: 2 });
    expect(qty.error?.issues.map((i) => i.path.join("."))).toContain("maxQuantity");

    expect(schema.safeParse({ ...base, amount: 1, slug: "Bad Slug" }).success).toBe(false);
    expect(schema.safeParse({ ...base, amount: 1 }).success).toBe(true);
  });

  it("maps empty optional texts to null and splits tags (incl. Persian comma)", () => {
    const values = { ...emptyProductFormValues(), title: { en: "T", fa: "" }, tags: "marble, oak،  walnut ,", amount: 5 };
    const input = formValuesToInput(values);
    expect(input.finish).toBeNull();
    expect(input.tags).toEqual(["marble", "oak", "walnut"]);
    expect(input.title).toEqual({ en: "T" });
  });

  it("slugifies titles", () => {
    expect(slugify("  Luna Coffee Table! ")).toBe("luna-coffee-table");
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });
});
