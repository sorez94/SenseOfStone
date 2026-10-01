"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatePreOrderInput, PreOrder, PreOrderListQuery } from "@/domain";
import { useServices } from "@/providers/services-context";

export const preOrderKeys = {
  all: ["pre-orders"] as const,
  list: (query: PreOrderListQuery) => ["pre-orders", "list", query] as const,
  detail: (id: string) => ["pre-orders", "detail", id] as const,
};

export function useMyPreOrders(query: PreOrderListQuery) {
  const { preOrders } = useServices();
  return useQuery({ queryKey: preOrderKeys.list(query), queryFn: () => preOrders.listMine(query), placeholderData: keepPreviousData });
}

export function useMyPreOrder(id: string) {
  const { preOrders } = useServices();
  return useQuery({ queryKey: preOrderKeys.detail(id), queryFn: () => preOrders.getMine(id) });
}

export function useCreatePreOrder() {
  const { preOrders } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePreOrderInput) => preOrders.create(input),
    onSuccess: (created) => {
      queryClient.setQueryData(preOrderKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: preOrderKeys.all });
    },
  });
}

export function useCancelPreOrder() {
  const { preOrders } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => preOrders.cancel(id, reason),
    onSuccess: (updated: PreOrder) => {
      queryClient.setQueryData(preOrderKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: preOrderKeys.all });
    },
  });
}
