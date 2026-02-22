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

/** Response from POST booking/create */
export interface CreateBookingResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    booking_id: number;
    customer: BookingCustomer;
    queue_number: number;
  };
}
