import { apiFetch } from "./client";
import { removeAccessTokenCookie } from "@/lib/cookie";
import type {
  CreateBookingRequest,
  CreateBookingResponse,
  BookingDetailsParams,
  BookingDetailsSingleResponse,
  BookingDetailsListResponse,
  AvailableSlotsParams,
  AvailableSlotsResponse,
} from "@/types/booking";

export async function createBooking(
  payload: CreateBookingRequest
): Promise<CreateBookingResponse> {
  return apiFetch<CreateBookingResponse>("booking/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function buildAvailableSlotsQuery(params: AvailableSlotsParams): string {
  const search = new URLSearchParams();
  search.set("shop_id", String(params.shop_id));
  search.set("start_date", params.start_date);
  search.set("end_date", params.end_date);
  if (params.specialist_ids?.length) {
    params.specialist_ids.forEach((id) => search.append("specialist_ids", String(id)));
  }
  return `booking/available_slots?${search.toString()}`;
}

export async function getAvailableSlots(params: AvailableSlotsParams): Promise<AvailableSlotsResponse> {
  return apiFetch<AvailableSlotsResponse>(buildAvailableSlotsQuery(params));
}

function buildBookingDetailsQuery(params: BookingDetailsParams): string {
  const search = new URLSearchParams();
  if (params.booking_id != null) search.set("booking_id", String(params.booking_id));
  if (params.user_id != null) search.set("user_id", String(params.user_id));
  if (params.shop_id != null) search.set("shop_id", String(params.shop_id));
  if (params.booking_status?.length)
    params.booking_status.forEach((s) => search.append("booking_status", s));
  if (params.booking_date_from) search.set("booking_date_from", params.booking_date_from);
  if (params.booking_date_to) search.set("booking_date_to", params.booking_date_to);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.page_size != null) search.set("page_size", String(params.page_size));
  if (params.page_num != null) search.set("page_num", String(params.page_num));
  if (params.show_booking_aggregation != null)
    search.set("show_booking_aggregation", String(params.show_booking_aggregation));
  if (params.show_user_info != null) search.set("show_user_info", String(params.show_user_info));
  if (params.show_specialist_info != null)
    search.set("show_specialist_info", String(params.show_specialist_info));
  if (params.show_booking_metrics != null)
    search.set("show_booking_metrics", String(params.show_booking_metrics));
  if (params.show_shop_info != null) search.set("show_shop_info", String(params.show_shop_info));
  const q = search.toString();
  return q ? `booking/details?${q}` : "booking/details";
}

export async function getBookingDetails(
  params: BookingDetailsParams,
  options?: { accessToken?: string | null }
): Promise<BookingDetailsSingleResponse | BookingDetailsListResponse> {
  const path = buildBookingDetailsQuery(params);
  const headers: HeadersInit = {};
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  try {
    return await apiFetch<BookingDetailsSingleResponse | BookingDetailsListResponse>(path, {
      method: "GET",
      headers,
    });
  } catch (err) {
    if ((err as Error & { code?: number }).code === 401) {
      removeAccessTokenCookie();
    }
    throw err;
  }
}

/** Response from PATCH booking/remove_existing (200 = success) */
export interface RemoveExistingBookingResponse {
  code: number;
  success: boolean;
  message: string;
  data: null;
}

export async function removeExistingBooking(options?: {
  accessToken?: string | null;
}): Promise<RemoveExistingBookingResponse> {
  const headers: HeadersInit = {};
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  try {
    return await apiFetch<RemoveExistingBookingResponse>("booking/remove_existing", {
      method: "PATCH",
      headers,
    });
  } catch (err) {
    if ((err as Error & { code?: number }).code === 401) {
      removeAccessTokenCookie();
    }
    throw err;
  }
}
