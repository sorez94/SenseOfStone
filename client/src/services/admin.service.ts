import type {
  Admin,
  AdminPreOrderListQuery,
  AdminProductListQuery,
  Category,
  CategoryInput,
  DashboardStats,
  PreOrder,
  Product,
  ProductInput,
  ProductOption,
  ProductStatus,
  ProductSummary,
  UpdatePreOrderNoteInput,
  UpdatePreOrderStatusInput,
} from "@/domain";
import type { ApiClient } from "@/lib/api/client";

export interface UploadedFile {
  id: string;
  url: string;
  contentType: string;
  size: number;
}

const id = (value: string) => encodeURIComponent(value);

/** Admin-only endpoints. Every call requires a user with role "admin". */
export function createAdminService(api: ApiClient) {
  return {
    me: () => api.get<Admin>("/admin/me"),
    getDashboard: () => api.get<DashboardStats>("/admin/dashboard"),

    products: {
      list: (query: AdminProductListQuery = {}) => api.page<ProductSummary>("/admin/products", { query: { ...query } }),
      get: (productId: string) => api.get<Product>(`/admin/products/${id(productId)}`),
      create: (input: ProductInput) => api.post<Product>("/admin/products", input),
      update: (productId: string, input: ProductInput) => api.put<Product>(`/admin/products/${id(productId)}`, input),
      setStatus: (productId: string, status: ProductStatus) =>
        api.patch<Product>(`/admin/products/${id(productId)}/status`, { status }),
      replaceOptions: (productId: string, options: ProductInput["options"]) =>
        api.put<ProductOption[]>(`/admin/products/${id(productId)}/options`, { options }),
      remove: (productId: string) => api.delete(`/admin/products/${id(productId)}`),
    },

    categories: {
      list: () => api.get<Category[]>("/admin/categories"),
      create: (input: CategoryInput) => api.post<Category>("/admin/categories", input),
      update: (categoryId: string, input: CategoryInput) => api.put<Category>(`/admin/categories/${id(categoryId)}`, input),
      remove: (categoryId: string) => api.delete(`/admin/categories/${id(categoryId)}`),
    },

    preOrders: {
      list: (query: AdminPreOrderListQuery = {}) => api.page<PreOrder>("/admin/pre-orders", { query: { ...query } }),
      get: (preOrderId: string) => api.get<PreOrder>(`/admin/pre-orders/${id(preOrderId)}`),
      updateStatus: (preOrderId: string, input: UpdatePreOrderStatusInput) =>
        api.patch<PreOrder>(`/admin/pre-orders/${id(preOrderId)}/status`, input),
      updateNote: (preOrderId: string, input: UpdatePreOrderNoteInput) =>
        api.patch<PreOrder>(`/admin/pre-orders/${id(preOrderId)}`, input),
    },

    uploadImage: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post<UploadedFile>("/admin/uploads", form);
    },
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
