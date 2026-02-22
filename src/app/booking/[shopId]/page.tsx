"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { useShopDetails, useCreateBooking } from "@/lib/tanstack";
import { toBookingDateTimeUTC, nowAsUTC } from "@/lib/datetime";
import type { ServiceItem } from "@/types/shop";

const DUMMY_BARBERS = [
  { id: "1", name: "Ahmad", avatar: "A" },
  { id: "2", name: "John", avatar: "J" },
  { id: "3", name: "Mike", avatar: "M" },
  { id: "4", name: "David", avatar: "D" },
];

const DUMMY_SERVICES = [
  { id: "1", name: "Haircut", price: "RM 25", duration: "30 min" },
  { id: "2", name: "Haircut + Beard", price: "RM 40", duration: "45 min" },
  { id: "3", name: "Beard Trim", price: "RM 15", duration: "20 min" },
  { id: "4", name: "Hair Wash", price: "RM 10", duration: "15 min" },
  { id: "5", name: "Full Service", price: "RM 50", duration: "60 min" },
];

function formatServicePrice(service: { price?: unknown }): string {
  const p = service.price;
  if (
    p != null &&
    typeof p === "object" &&
    "currency" in p &&
    "value" in p
  ) {
    const { currency, value } = p as { currency: string; value: number };
    return currency + " " + value;
  }
  return typeof p === "string" ? p : "";
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Format "HH:mm:ss" to "h:mm AM/PM" for display */
function formatTimeForDisplay(hhmmss: string): string {
  const [h = "0", m = "0"] = hhmmss.split(":");
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  if (hour === 0 && minute === 0) return "12:00 AM";
  if (hour === 12) return "12:" + String(minute).padStart(2, "0") + " PM";
  if (hour > 12) return (hour - 12) + ":" + String(minute).padStart(2, "0") + " PM";
  return hour + ":" + String(minute).padStart(2, "0") + " AM";
}

/** Build time slots from opening_hours for the given date. Returns display strings like "10:00 AM". */
function buildTimeSlotsFromHours(
  dateStr: string,
  openingHours: { days: string; opening_time: string; closing_time: string; is_closed: number }[],
  gapMinutes: number
): string[] {
  if (!dateStr || !openingHours?.length || gapMinutes <= 0) return [];
  const date = new Date(dateStr + "T12:00:00");
  const dayName = DAY_NAMES[date.getDay()];
  const dayHours = openingHours.find((h) => h.days === dayName);
  if (!dayHours || dayHours.is_closed) return [];
  const [openH, openM] = dayHours.opening_time.split(":").map(Number);
  const [closeH, closeM] = dayHours.closing_time.split(":").map(Number);
  let startMins = openH * 60 + openM;
  const endMins = closeH * 60 + closeM;
  const slots: string[] = [];
  while (startMins < endMins) {
    const h = Math.floor(startMins / 60);
    const m = startMins % 60;
    const timeStr = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00";
    slots.push(formatTimeForDisplay(timeStr));
    startMins += gapMinutes;
  }
  return slots;
}

type BookingType = "walk-in" | "booking" | null;

interface FormData {
  type: BookingType;
  name: string;
  phone: string;
  shopId: string;
  barberId: string;
  date: string;
  time: string;
  serviceIds: string[];
  queueNumber?: number;
}

interface BookingResult {
  booking_id: number;
  queue_number: number;
}

export default function BookingPage() {
  const params = useParams();
  const shopIdFromPath = params.shopId as string;
  const shopId = useMemo(() => {
    if (!shopIdFromPath) return null;
    const n = parseInt(shopIdFromPath, 10);
    return Number.isNaN(n) ? null : n;
  }, [shopIdFromPath]);

  const { data: shopDetails, isError: isShopError, isLoading: isShopLoading } = useShopDetails(shopId);
  const createBookingMutation = useCreateBooking();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    type: null,
    name: "",
    phone: "+60",
    shopId: "",
    barberId: "",
    date: formatDateLocal(new Date()),
    time: "",
    serviceIds: [],
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const shop = shopDetails?.data?.shop;
  const servicesFromApi = useMemo(
    (): ServiceItem[] => shopDetails?.data?.services?.flatMap((g) => g.list) ?? [],
    [shopDetails]
  );
  const specialistsFromApi = shopDetails?.data?.specialists ?? [];

  const displayShopName =
    shop?.name ?? (shopId != null ? "Shop " + shopId : "Trimmly");
  type ListService = ServiceItem | (typeof DUMMY_SERVICES)[number];
  const servicesList: ListService[] = servicesFromApi.length > 0 ? servicesFromApi : DUMMY_SERVICES;
  const barbersList =
    specialistsFromApi.length > 0
      ? specialistsFromApi.map((s: { specialist_id: number; name: string }) => ({
          id: String(s.specialist_id),
          name: s.name,
          avatar: s.name.charAt(0),
        }))
      : DUMMY_BARBERS;

  const openingHours = shopDetails?.data?.opening_hours ?? [];
  const gapMinutes = shop?.booking_suggestion_gap ?? 30;
  const timeSlots = useMemo(
    () => buildTimeSlotsFromHours(formData.date, openingHours, gapMinutes),
    [formData.date, openingHours, gapMinutes]
  );
  const timeSlotsList = timeSlots.length > 0 ? timeSlots : ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

  const showShopNotFound =
    (shopId != null && isShopError) ||
    (shopId != null && !isShopLoading && !shopDetails?.data) ||
    (shopIdFromPath !== undefined && shopId === null);

  const handleTypeSelect = (type: BookingType) => {
    const now = new Date();
    const dateStr = formatDateLocal(now);
    setFormData((prev) => ({ ...prev, type, date: dateStr }));
    setStep(2);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (sid: string) => {
    setFormData((prev) => {
      const next = prev.serviceIds.includes(sid)
        ? prev.serviceIds.filter((id) => id !== sid)
        : [...prev.serviceIds, sid];
      return { ...prev, serviceIds: next };
    });
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+60")) {
      setFormData((prev) => ({ ...prev, phone: "+60" + cleaned.substring(3) }));
    } else if (cleaned.startsWith("60")) {
      setFormData((prev) => ({ ...prev, phone: "+60" + cleaned.substring(2) }));
    } else if (cleaned.startsWith("+")) {
      setFormData((prev) => ({ ...prev, phone: "+60" + cleaned.substring(1).replace(/^60/, "") }));
    } else {
      setFormData((prev) => ({ ...prev, phone: "+60" + cleaned }));
    }
  };

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePrevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (shopId != null && shop) {
      const bookingDateTime =
        formData.type === "walk-in"
          ? nowAsUTC()
          : toBookingDateTimeUTC(formData.date, formData.time);
      const serviceIds = formData.serviceIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
      if (serviceIds.length === 0) return;
      try {
        const res = await createBookingMutation.mutateAsync({
          shop_id: shopId,
          user_details: {
            phone_number: formData.phone.trim(),
            name: formData.name.trim() || undefined,
          },
          booking_date_time: bookingDateTime,
          services_id: serviceIds,
          ...(formData.barberId ? { specialist_id: parseInt(formData.barberId, 10) } : {}),
          status: "Confirmed",
          payment_method: "Cash",
          created_from: "booking-web",
          payment_status: "PENDING",
          booking_method: formData.type === "walk-in" ? "Walk In" : "Online",
        });
        setBookingResult({
          booking_id: res.data.booking_id,
          queue_number: res.data.queue_number,
        });
        setIsSubmitted(true);
      } catch {
        // Error shown via createBookingMutation.error (code + message)
      }
      return;
    }
    if (formData.type === "walk-in") {
      setFormData((prev) => ({ ...prev, queueNumber: Math.floor(Math.random() * 50) + 1 }));
    }
    setBookingResult(null);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setFormData({
      type: null,
      name: "",
      phone: "+60",
      shopId: "",
      barberId: "",
      date: formatDateLocal(new Date()),
      time: "",
      serviceIds: [],
    });
    setStep(1);
    setIsSubmitted(false);
    setBookingResult(null);
  };

  const isStep2Valid = () => {
    if (formData.type === "walk-in") {
      return formData.phone.trim() !== "" && formData.phone.replace(/\D/g, "").length >= 10;
    }
    return formData.date !== "" && shopId != null;
  };

  const isStep3Valid = () => {
    if (formData.type === "booking") return formData.time !== "";
    return true;
  };

  const selectedShop = shop
    ? { id: String(shop.id), name: shop.name, address: shopDetails?.data?.address?.formatted_address ?? "" }
    : { id: String(shopId ?? ""), name: displayShopName, address: "" };
  const selectedBarber = barbersList.find((b: { id: string }) => b.id === formData.barberId);
  const selectedServices =
    servicesFromApi.length > 0
      ? formData.serviceIds
          .map((id) => servicesFromApi.find((s) => String(s.id) === id))
          .filter((s): s is ServiceItem => s != null)
      : formData.serviceIds
          .map((id) => DUMMY_SERVICES.find((s) => s.id === id))
          .filter((s): s is (typeof DUMMY_SERVICES)[number] => s != null);

  const apiError = createBookingMutation.error as Error & { code?: number } | null;

  if (showShopNotFound) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2">Shop not found</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              {shopId === null
                ? "This booking link is invalid. Please check the URL or use the link shared by the shop."
                : "We couldn’t find this shop. It may have been removed or the link may be incorrect."}
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Go home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 rounded-full flex items-center justify-center mx-auto mb-6">
              {formData.type === "walk-in" && (bookingResult?.queue_number ?? formData.queueNumber) != null ? (
                <span className="text-2xl font-bold text-white">#{bookingResult?.queue_number ?? formData.queueNumber}</span>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
              {formData.type === "walk-in" ? "Walk-in Confirmed!" : "Booking Confirmed!"}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {formData.type === "walk-in"
                ? "You're all set! Please proceed to the shop."
                : "Your appointment has been scheduled."}
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Shop</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedShop?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                  {formData.date ? new Date(formData.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "-"}
                </span>
              </div>
              {formData.type === "booking" && formData.time && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Time</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.time}</span>
                </div>
              )}
              {formData.type === "walk-in" && (bookingResult?.queue_number ?? formData.queueNumber) != null && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Queue Number</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">#{bookingResult?.queue_number ?? formData.queueNumber}</span>
                </div>
              )}
              {formData.type === "booking" && bookingResult?.booking_id != null && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Booking ID</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{bookingResult.booking_id}</span>
                </div>
              )}
              {selectedBarber && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Barber</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedBarber.name}</span>
                </div>
              )}
            </div>
            <button
              onClick={resetForm}
              className="w-full h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Booking
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step > i ? "bg-linear-to-r from-blue-500 to-blue-700 text-white"
                        : step === i ? "bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {step > i ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i
                    )}
                  </div>
                  {i < 5 && (
                    <div
                      className={`w-8 sm:w-12 h-1 mx-1 rounded transition-all ${
                        step > i ? "bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90" : step === i ? "bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90" : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {step === 1 && "Choose Type"}
                {step === 2 && (formData.type === "walk-in" ? "Your Details" : "Select Date & Shop")}
                {step === 3 && (formData.type === "walk-in" ? "Select Service" : "Choose Barber")}
                {step === 4 && (formData.type === "walk-in" ? "Choose Barber" : "Select Service")}
                {step === 5 && "Confirm"}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                    Welcome to {displayShopName}!
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400">How would you like to proceed?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleTypeSelect("walk-in")}
                    className="group relative p-6 rounded-xl shadow-md dark:bg-zinc-950 dark:border dark:border-zinc-800/30 transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                      <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1">Walk-in</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Join the queue now</p>
                  </button>
                  <button
                    onClick={() => handleTypeSelect("booking")}
                    className="group relative p-6 rounded-xl shadow-md dark:bg-zinc-950 dark:border dark:border-zinc-800/30 transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                      <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1">Book Appointment</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Schedule for later</p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                    {formData.type === "walk-in" ? "Your Details" : "Select Date & Shop"}
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {formData.type === "walk-in" ? "Please enter your information" : "Choose when and where"}
                  </p>
                </div>
                <div className="space-y-4">
                  {formData.type === "booking" && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Date</label>
                      <button
                        type="button"
                        onClick={() => setDatePickerOpen((open) => !open)}
                        className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-left flex items-center justify-between"
                      >
                        <span>
                          {formData.date
                            ? new Date(formData.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                            : "Select date"}
                        </span>
                        <svg className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform ${datePickerOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {datePickerOpen && (
                        <>
                          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setDatePickerOpen(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                            <div className="flex justify-center overflow-x-auto p-2 sm:p-3">
                              <Calendar
                                mode="single"
                                selected={formData.date ? new Date(formData.date + "T12:00:00") : undefined}
                                onSelect={(date) => {
                                  handleInputChange("date", date ? formatDateLocal(date) : "");
                                  setDatePickerOpen(false);
                                }}
                                fromDate={new Date()}
                                className="[--cell-size:1.875rem] sm:[--cell-size:2.25rem] md:[--cell-size:2.5rem]"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Shop</label>
                    <div className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex items-center text-zinc-900 dark:text-zinc-200">
                      {selectedShop?.name ?? displayShopName ?? "—"}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Determined by your booking link</p>
                  </div>
                  {formData.type === "walk-in" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name (optional)</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your name"
                          className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-200 font-medium">+60</span>
                          <input
                            type="tel"
                            value={formData.phone.startsWith("+60") ? formData.phone.substring(3) : formData.phone.replace(/^\+?60?/, "")}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="123456789"
                            className="w-full h-12 pl-14 pr-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Back</button>
                  <button onClick={handleNextStep} disabled={!isStep2Valid()} className="flex-1 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {formData.type === "walk-in" ? (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">Select Service</h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Choose the service you need</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {servicesList.map((service: { id: number | string; name: string; duration?: string; price?: unknown }) => {
                        const sid = String(service.id);
                        const selected = formData.serviceIds.includes(sid);
                        return (
                          <button
                            key={sid}
                            type="button"
                            onClick={() => handleServiceToggle(sid)}
                            className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                              selected ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950" : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{service.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.duration ?? ""}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {selected && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  </span>
                                )}
                                <p className="font-semibold text-zinc-900 dark:text-zinc-200">{formatServicePrice(service)}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">Select Time & Barber</h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Pick a time slot and optionally choose your barber</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Available Time Slots</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlotsList.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleInputChange("time", time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              formData.time === time ? "bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Preferred Barber (Optional)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {barbersList.map((barber: { id: string; name: string; avatar: string }) => (
                          <button
                            key={barber.id}
                            onClick={() => handleInputChange("barberId", formData.barberId === barber.id ? "" : barber.id)}
                            className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                              formData.barberId === barber.id ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950" : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                formData.barberId === barber.id ? "bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                              }`}>
                                {barber.avatar}
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{barber.name}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-3">
                  <button onClick={handlePrevStep} className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Back</button>
                  <button onClick={handleNextStep} disabled={formData.type === "walk-in" ? formData.serviceIds.length === 0 : !isStep3Valid()} className="flex-1 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                {formData.type === "walk-in" ? (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">Choose Barber</h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Optional - or skip to join any available barber</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Select Barber (Optional)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {barbersList.map((barber: { id: string; name: string; avatar: string }) => (
                          <button
                            key={barber.id}
                            onClick={() => handleInputChange("barberId", formData.barberId === barber.id ? "" : barber.id)}
                            className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                              formData.barberId === barber.id ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950" : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                formData.barberId === barber.id ? "bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                              }`}>
                                {barber.avatar}
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{barber.name}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handlePrevStep} className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Back</button>
                      <button onClick={handleNextStep} className="flex-1 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                        {!formData.barberId ? "I don't mind" : "Continue"}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">Select Service</h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Choose one or more services</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {servicesList.map((service: { id: number | string; name: string; duration?: string; price?: unknown }) => {
                        const sid = String(service.id);
                        const selected = formData.serviceIds.includes(sid);
                        return (
                          <button
                            key={sid}
                            type="button"
                            onClick={() => handleServiceToggle(sid)}
                            className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                              selected ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950" : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{service.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.duration ?? ""}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {selected && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  </span>
                                )}
                                <p className="font-semibold text-zinc-900 dark:text-zinc-200">{formatServicePrice(service)}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name (optional)</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your name"
                          className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-200 font-medium">+60</span>
                          <input
                            type="tel"
                            value={formData.phone.startsWith("+60") ? formData.phone.substring(3) : formData.phone.replace(/^\+?60?/, "")}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="123456789"
                            className="w-full h-12 pl-14 pr-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handlePrevStep} className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Back</button>
                      <button onClick={handleNextStep} disabled={formData.serviceIds.length === 0 || !formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10} className="flex-1 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        Continue
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                    {formData.type === "walk-in" ? "Confirm Walk-in" : "Booking Summary"}
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400">Review your information</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Booking Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Type</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200 capitalize">{formData.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Shop</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedShop?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">
                      {formData.date ? new Date(formData.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "-"}
                    </span>
                  </div>
                  {formData.type === "booking" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Time</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.time || "-"}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Services</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200 text-right max-w-[60%]">
                      {selectedServices.length > 0 ? selectedServices.map((s: { name: string }) => s.name).join(", ") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Barber</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedBarber?.name || "Any Available"}</span>
                  </div>
                  {formData.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.name}</span>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Phone</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.phone}</span>
                    </div>
                  )}
                </div>
                {apiError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-4 text-left">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {typeof (apiError as { code?: number }).code === "number" && (
                        <span className="mr-2">Error {(apiError as Error & { code?: number }).code}:</span>
                      )}
                      {apiError.message}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={handlePrevStep} className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Back</button>
                  <button
                    onClick={() => void handleSubmit()}
                    disabled={formData.serviceIds.length === 0 || !formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10 || createBookingMutation.isPending}
                    className="flex-1 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-black/90 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createBookingMutation.isPending ? (
                      <span className="animate-pulse">Creating…</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm {formData.type === "walk-in" ? "Walk-in" : "Booking"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20">
          <Image src="/logo-light-full.png" alt="Trimmly" width={220} height={64} className="h-14 w-auto dark:hidden" priority />
          <Image src="/logo-dark-full.png" alt="Trimmly" width={220} height={64} className="h-14 w-auto hidden dark:block" priority />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">© 2024-2026 Trimmly Inc.</p>
        </div>
      </div>
    </footer>
  );
}
