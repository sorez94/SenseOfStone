import { describe, expect, it } from "vitest";
import { hasActiveFilters, parseProductSearchParams, productListHref } from "./search-params";

describe("parseProductSearchParams", () => {
  it("parses valid params and drops invalid ones", () => {
    const query = parseProductSearchParams({
      q: "  marble ",
      category: "tables",
      materialType: "plastic",
      availability: "in_stock",
      preOrderOnly: "true",
      minPrice: "-5",
      maxPrice: "1000",
      sort: "price_desc",
      page: "3",
    });
    expect(query).toMatchObject({
      q: "marble",
      category: "tables",
      materialType: undefined,
      availability: "in_stock",
      preOrderOnly: true,
      minPrice: undefined,
      maxPrice: 1000,
      sort: "price_desc",
      page: 3,
    });
  });

  it("defaults page to 1 and handles arrays", () => {
    expect(parseProductSearchParams({ page: "0", q: ["a", "b"] })).toMatchObject({ page: 1, q: "a" });
  });
});

describe("productListHref", () => {
  it("omits empty values and page 1", () => {
    expect(productListHref({})).toBe("/products");
    expect(productListHref({ q: "onyx", materialType: "stone", preOrderOnly: false }, 1)).toBe("/products?q=onyx&materialType=stone");
    expect(productListHref({ sort: "newest" }, 2)).toBe("/products?sort=newest&page=2");
  });

  it("detects active filters", () => {
    expect(hasActiveFilters({ sort: "newest" })).toBe(false);
    expect(hasActiveFilters({ minPrice: 0 })).toBe(true);
  });
});
