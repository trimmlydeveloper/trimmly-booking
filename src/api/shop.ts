import { apiFetch } from "./client";
import type { ShopDetailsResponse } from "@/types/shop";

export async function getShopDetails(
  shopId: number
): Promise<ShopDetailsResponse> {
  return apiFetch<ShopDetailsResponse>(`shop/details?shop_id=${shopId}`);
}
