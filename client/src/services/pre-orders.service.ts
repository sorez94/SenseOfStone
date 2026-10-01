import type { CreatePreOrderInput, PreOrder, PreOrderListQuery } from "@/domain";
import type { ApiClient } from "@/lib/api/client";

/** Pre-orders of the signed-in customer. */
export function createPreOrdersService(api: ApiClient) {
  return {
    create: (input: CreatePreOrderInput) => api.post<PreOrder>("/pre-orders", input),
    listMine: (query: PreOrderListQuery = {}) => api.page<PreOrder>("/pre-orders", { query: { ...query } }),
    getMine: (id: string) => api.get<PreOrder>(`/pre-orders/${encodeURIComponent(id)}`),
    cancel: (id: string, reason?: string) => api.post<PreOrder>(`/pre-orders/${encodeURIComponent(id)}/cancel`, { reason }),
  };
}

export type PreOrdersService = ReturnType<typeof createPreOrdersService>;
