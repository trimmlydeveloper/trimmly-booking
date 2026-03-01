"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "@/api/booking";

export const availableSlotsQueryKey = (params: {
  shopId: number;
  startDate: string;
  endDate: string;
  specialistId?: number | null;
}) => ["booking", "available_slots", params.shopId, params.startDate, params.endDate, params.specialistId] as const;

/** Fetches available slots for a shop and date range, optionally filtered by specialist. */
export function useAvailableSlots(options: {
  shopId: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  specialistId?: number | null;
}) {
  const { shopId, startDate, endDate, specialistId } = options;

  const query = useQuery({
    queryKey: availableSlotsQueryKey({
      shopId: shopId ?? 0,
      startDate,
      endDate,
      specialistId: specialistId ?? undefined,
    }),
    queryFn: () =>
      getAvailableSlots({
        shop_id: shopId!,
        start_date: startDate,
        end_date: endDate,
        ...(specialistId != null && specialistId > 0 ? { specialist_ids: [specialistId] } : {}),
      }),
    enabled: Boolean(shopId != null && shopId > 0 && startDate && endDate),
  });

  const specialists = query.data?.data?.specialists ?? [];
  const availableSlots = query.data?.data?.available_slots ?? [];

  /** Get time options for a specific date from available_slots */
  const getTimeOptionsForDate = (date: string) => {
    const group = availableSlots.find((s) => s.date === date);
    return group?.time ?? [];
  };

  return {
    ...query,
    specialists,
    availableSlots,
    getTimeOptionsForDate,
  };
}
