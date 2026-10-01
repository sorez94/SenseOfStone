import type { PreOrder, PreOrderStatus } from "./pre-order";
import type { ProductStatus } from "./product";

export interface DashboardStats {
  products: { total: number; byStatus: Record<ProductStatus, number> };
  categories: { total: number };
  preOrders: { total: number; byStatus: Record<PreOrderStatus, number> };
  customers: { total: number };
  recentPreOrders: PreOrder[];
}
