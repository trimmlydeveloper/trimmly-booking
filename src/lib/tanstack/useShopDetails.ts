"use client";

import { useQuery } from "@tanstack/react-query";
import { getShopDetails } from "@/api/shop";

export const shopDetailsQueryKey = (shopId: number) =>
  ["shop", "details", shopId] as const;

export function useShopDetails(shopId: number | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: shopDetailsQueryKey(shopId ?? 0),
    queryFn: () => getShopDetails(shopId!),
    enabled: options?.enabled !== false && typeof shopId === "number" && shopId > 0,
  });
}
