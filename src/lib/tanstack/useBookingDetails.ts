"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingDetails } from "@/api/booking";
import type { BookingDetailsItem } from "@/types/booking";

export const bookingDetailsQueryKey = (params: { token: string; shopId?: number }) =>
  ["booking", "details", params.token, params.shopId] as const;

/** Fetches confirmed bookings when accessToken is present. Disabled when no token (first-time device). */
export function useBookingDetails(options: {
  accessToken: string | null;
  shopId?: number | null;
}) {
  const { accessToken, shopId } = options;

  const query = useQuery({
    queryKey: bookingDetailsQueryKey({ token: accessToken ?? "", shopId: shopId ?? undefined }),
    queryFn: async () => {
      const res = await getBookingDetails(
        {
          ...(shopId != null && shopId > 0 ? { shop_id: shopId } : {}),
          booking_status: ["Pending"],
          show_shop_info: true,
          page_size: 20,
          page_num: 1,
        },
        { accessToken: accessToken ?? undefined }
      );
      if (!res.success || !res.data) return [];
      const d = res.data as { bookings?: BookingDetailsItem[]; items?: BookingDetailsItem[] };
      return d.bookings ?? d.items ?? [];
    },
    enabled: Boolean(accessToken?.trim()),
  });

  return {
    ...query,
    confirmedBookings: Array.isArray(query.data) ? query.data : [],
  };
}
