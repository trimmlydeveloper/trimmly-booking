"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBooking } from "@/api/booking";
import type { CreateBookingRequest } from "@/types/booking";
import { shopDetailsQueryKey } from "./useShopDetails";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingRequest) => createBooking(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: shopDetailsQueryKey(variables.shop_id),
      });
    },
  });
}
