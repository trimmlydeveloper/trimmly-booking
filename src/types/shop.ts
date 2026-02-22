export interface ShopAddress {
  id: number;
  shop_id: number;
  city: string;
  country: string;
  state: string;
  postal_code: string;
  formatted_address: string;
  simple_formatted: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface ShopImage {
  long_description: string;
  url: string;
}

export interface OpeningHour {
  id: number;
  shop_id: number;
  days: string;
  opening_time: string;
  closing_time: string;
  is_closed: number;
  created_at: string;
  updated_at: string;
}

export interface ServicePrice {
  currency: string;
  value: number;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: ServicePrice;
  discount: number | null;
}

export interface ServiceGroup {
  type: string;
  icon: string;
  list: ServiceItem[];
}

export interface ShopOwner {
  guid: string;
  name: string;
  image: string;
}

export interface Specialist {
  specialist_id: number;
  name: string;
  description: string;
  image: string;
  rating: number;
  review_count: number;
}

export interface ShopRecord {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  status: string;
  timezone: string;
  shop_icon: string;
  booking_advance_days: number;
  booking_suggestion_gap: number;
  created_at: string;
  updated_at: string;
}

export interface ShopDetailsData {
  shop: ShopRecord;
  address: ShopAddress;
  cover_image: ShopImage;
  cover_image_url: string;
  all_images: ShopImage[];
  gallery_images: ShopImage[];
  opening_hours: OpeningHour[];
  services: ServiceGroup[];
  specialists: Specialist[];
  owner: ShopOwner;
  rating: number;
  review_count: number;
  display_price: number;
  distance: number;
}

export interface ShopDetailsResponse {
  code: number;
  success: boolean;
  message: string;
  data: ShopDetailsData;
}
