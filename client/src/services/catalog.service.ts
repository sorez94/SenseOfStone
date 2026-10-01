import type { Category, Product, ProductListQuery, ProductOption, ProductSummary } from "@/domain";
import type { ApiClient } from "@/lib/api/client";

/** Public (storefront) catalog endpoints. Only published products are returned. */
export function createCatalogService(api: ApiClient) {
  return {
    listProducts: (query: ProductListQuery = {}) => api.page<ProductSummary>("/products", { query: { ...query } }),
    getProductBySlug: (slug: string) => api.get<Product>(`/products/slug/${encodeURIComponent(slug)}`),
    getProductById: (id: string) => api.get<Product>(`/products/${encodeURIComponent(id)}`),
    getProductOptions: (id: string) => api.get<ProductOption[]>(`/products/${encodeURIComponent(id)}/options`),
    getRelatedProducts: (id: string, limit = 4) =>
      api.get<ProductSummary[]>(`/products/${encodeURIComponent(id)}/related`, { query: { limit } }),
    listCategories: () => api.get<Category[]>("/categories"),
    getCategoryBySlug: (slug: string) => api.get<Category>(`/categories/slug/${encodeURIComponent(slug)}`),
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
