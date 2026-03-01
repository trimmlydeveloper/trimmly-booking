/** Request payload for POST booking/create */
export interface CreateBookingRequest {
  shop_id: number;
  user_details: {
    phone_number: string;
    name?: string;
  };
  booking_date_time: string; // ISO 8601 e.g. "2026-02-15T13:43:00Z"
  services_id: number[];
  specialist_id?: number; // optional
  status: "Confirmed" | "Pending" | "Cancelled";
  payment_method: "Cash" | "Card" | "Online" | string;
  created_from: "booking-web" | "booking-mobile" | "booking-app" | "admin-web";
  payment_status: "PENDING" | "PAID" | "REFUNDED";
  booking_method: "Walk In" | "Online";
}

/** Customer in create booking response */
export interface BookingCustomer {
  id: number;
  user_id: number;
  shop_id: number;
  active: number;
  created_at: string;
  updated_at: string;
}

/** Response from POST booking/create (code may be 201 on success) */
export interface CreateBookingResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    access_token?: string;
    booking_id: number;
    customer: BookingCustomer;
    queue_number: number;
  };
}

/** Query params for GET booking/details */
export interface BookingDetailsParams {
  booking_id?: number;
  user_id?: number;
  shop_id?: number;
  booking_status?: ("Pending" | "Confirmed" | "Cancelled" | "Completed" | "On Hold")[];
  booking_date_from?: string;
  booking_date_to?: string;
  sort_by?: string;
  page_size?: number;
  page_num?: number;
  show_booking_aggregation?: boolean;
  show_user_info?: boolean;
  show_specialist_info?: boolean;
  show_booking_metrics?: boolean;
  show_shop_info?: boolean;
}

/** Booking info from GET booking/details */
export interface BookingInfo {
  id: number;
  shop_id: number;
  customer_id: number;
  specialist_id: number | null;
  reservation_phone_no: string;
  reservation_name: string | null;
  reservation_email: string | null;
  booking_date_from: string;
  booking_date_to: string;
  duration_minutes: number;
  total_price: number;
  currency: string;
  status: string;
  created_from: string;
  created_at: string;
  updated_at: string;
}

/** Single booking details response (when booking_id is provided) */
export interface BookingDetailsSingleResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    booking_info: BookingInfo;
    payment_info?: unknown;
    user_info?: unknown;
    specialist_info?: unknown;
    shop_info?: unknown;
  };
}

/** One item in list response from GET booking/details */
export interface BookingDetailsItem {
  booking_info: BookingInfo;
  payment_info?: unknown;
  user_info?: unknown;
  specialist_info?: unknown;
  shop_info?: { name?: string; address?: unknown } | null;
}

/** Optional scalar from API (e.g. status: { String: "Pending", Valid: true }) */
export interface ApiOptionalScalar<T = string> {
  String?: T;
  Valid: boolean;
}

/** Existing booking returned in 409 conflict from POST booking/create */
export interface ExistingBookingFrom409 {
  id: number;
  shop_id: number;
  customer_id?: { Int64: number; Valid: boolean } | number;
  specialist_id?: number;
  reservation_phone_no?: string;
  reservation_name?: string;
  reservation_email?: string;
  booking_date_from: string;
  booking_date_to: string;
  duration_minutes?: number;
  total_price?: number;
  currency?: string;
  status?: ApiOptionalScalar | string;
  services?: string;
  notes?: ApiOptionalScalar | string;
  booking_method?: string;
  cancellation_reason?: ApiOptionalScalar | string;
  created_from?: ApiOptionalScalar | string;
  created_at?: string;
  updated_at?: string;
}

/** 409 response body from POST booking/create */
export interface CreateBookingConflictData {
  access_token?: string;
  existing_booking?: ExistingBookingFrom409;
  redirect?: string;
}

/** Paginated list response from GET booking/details (no booking_id) */
export interface BookingDetailsListResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    bookings?: BookingDetailsItem[];
    items?: BookingDetailsItem[];
    total?: number;
    page_num?: number;
    page_size?: number;
  };
}

/** Query params for GET booking/available_slots */
export interface AvailableSlotsParams {
  shop_id: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  specialist_ids?: number[];
}

/** Specialist from available_slots response. API uses user_id in specialist_ids param. */
export interface AvailableSlotSpecialist {
  user_id: number;
  name: string;
  image_url?: string;
  years_experience?: number;
  specialist_id: number;
  hired_date?: string;
}

/** Time slot option from available_slots */
export interface AvailableSlotTimeOption {
  label: string;
  value: string; // ISO e.g. "2025-03-01T09:00:00+08:00"
}

/** Date group in available_slots */
export interface AvailableSlotDateGroup {
  date: string; // YYYY-MM-DD
  time: AvailableSlotTimeOption[];
}

/** Response from GET booking/available_slots */
export interface AvailableSlotsResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    specialists: AvailableSlotSpecialist[];
    services?: { id: number; name: string; duration_minutes: number; price: number }[];
    available_slots: AvailableSlotDateGroup[];
  };
}
