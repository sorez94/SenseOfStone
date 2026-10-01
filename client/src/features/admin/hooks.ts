"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminPreOrderListQuery,
  AdminProductListQuery,
  CategoryInput,
  ProductInput,
  ProductStatus,
  UpdatePreOrderNoteInput,
  UpdatePreOrderStatusInput,
} from "@/domain";
import { useServices } from "@/providers/services-context";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: ["admin", "dashboard"] as const,
  products: ["admin", "products"] as const,
  productList: (query: AdminProductListQuery) => ["admin", "products", "list", query] as const,
  product: (id: string) => ["admin", "products", "detail", id] as const,
  categories: ["admin", "categories"] as const,
  preOrders: ["admin", "pre-orders"] as const,
  preOrderList: (query: AdminPreOrderListQuery) => ["admin", "pre-orders", "list", query] as const,
  preOrder: (id: string) => ["admin", "pre-orders", "detail", id] as const,
};

/* Dashboard */

export function useDashboard() {
  const { admin } = useServices();
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: admin.getDashboard });
}

/* Products */

export function useAdminProducts(query: AdminProductListQuery) {
  const { admin } = useServices();
  return useQuery({ queryKey: adminKeys.productList(query), queryFn: () => admin.products.list(query), placeholderData: keepPreviousData });
}

export function useAdminProduct(id: string) {
  const { admin } = useServices();
  return useQuery({ queryKey: adminKeys.product(id), queryFn: () => admin.products.get(id) });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.products }),
      queryClient.invalidateQueries({ queryKey: adminKeys.categories }),
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
    ]);
}

export function useSaveProduct(id?: string) {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductInput) => (id ? admin.products.update(id, input) : admin.products.create(input)),
    onSuccess: (product) => {
      queryClient.setQueryData(adminKeys.product(product.id), product);
      void invalidate();
    },
  });
}

export function useSetProductStatus() {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) => admin.products.setStatus(id, status),
    onSuccess: (product) => {
      queryClient.setQueryData(adminKeys.product(product.id), product);
      void invalidate();
    },
  });
}

export function useDeleteProduct() {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => admin.products.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: adminKeys.product(id) });
      void invalidate();
    },
  });
}

/* Categories */

export function useAdminCategories() {
  const { admin } = useServices();
  return useQuery({ queryKey: adminKeys.categories, queryFn: admin.categories.list });
}

export function useSaveCategory() {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) => (id ? admin.categories.update(id, input) : admin.categories.create(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useDeleteCategory() {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => admin.categories.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

/* Pre-orders */

export function useAdminPreOrders(query: AdminPreOrderListQuery) {
  const { admin } = useServices();
  return useQuery({ queryKey: adminKeys.preOrderList(query), queryFn: () => admin.preOrders.list(query), placeholderData: keepPreviousData });
}

export function useAdminPreOrder(id: string) {
  const { admin } = useServices();
  return useQuery({ queryKey: adminKeys.preOrder(id), queryFn: () => admin.preOrders.get(id) });
}

export function useUpdatePreOrderStatus(id: string) {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreOrderStatusInput) => admin.preOrders.updateStatus(id, input),
    onSuccess: (preOrder) => {
      queryClient.setQueryData(adminKeys.preOrder(id), preOrder);
      void queryClient.invalidateQueries({ queryKey: adminKeys.preOrders });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useUpdatePreOrderNote(id: string) {
  const { admin } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreOrderNoteInput) => admin.preOrders.updateNote(id, input),
    onSuccess: (preOrder) => queryClient.setQueryData(adminKeys.preOrder(id), preOrder),
  });
}
