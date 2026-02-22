import { apiFetch } from "./client";
import type {
  CreateBookingRequest,
  CreateBookingResponse,
} from "@/types/booking";

export async function createBooking(
  payload: CreateBookingRequest
): Promise<CreateBookingResponse> {
  return apiFetch<CreateBookingResponse>("booking/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
